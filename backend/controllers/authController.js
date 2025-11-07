// backend/controllers/authController.js
require('dotenv').config();
const userModel = require('../models/userModel');
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const brevo = require('@getbrevo/brevo');
const { validationResult } = require('express-validator'); // <-- 1. IMPORTADO

// --- VARIABLES DE ENTORNO ---
const JWT_SECRET = process.env.JWT_SECRET;
const secretKey = process.env.RECAPTCHA_SECRET_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL; 
const SENDER_NAME = "Sistema de Avisos REPA";
const CLIENT_URL = process.env.CLIENT_URL;
// -------------------------------------

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1d' });
};

exports.registerUser = async (req, res) => {
    // --- 2. AÑADIDO: Bloque de validación ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const { curp, email, password, recaptchaToken } = req.body;

        if (!recaptchaToken) { /* ... */ }

        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
        const verificationResponse = await axios.post(verificationURL);
        if (!verificationResponse.data.success) {
            return res.status(400).json({ message: 'Falló la verificación reCAPTCHA.' });
        }
        if (await userModel.findUserByCurp(curp) || await userModel.findUserByEmail(email)) {
            return res.status(400).json({ message: 'El CURP o correo electrónico ya existe.' });
        }

        await userModel.createUser({ curp, email, password });

        const homeLink = `${CLIENT_URL}/home.html`;

        // --- 3. CORRECCIÓN DE SEGURIDAD CRÍTICA ---
        const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Estimado pescador, le estamos enviando sus <strong>Datos de acceso</strong> que deberá usar para ingresar al formulario de captura de los <strong>avisos de arribo.</strong></p>
            <p>Sus datos de acceso son de uso personal, para que solo usted pueda ingresar al formulario de captura y efectuar los avisos de arribo, a nombre de la sociedad cooperativa pesquera que representa o bien a nombre propio por ser permisionario individual.</p>
            
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
                <p><strong>CURP:</strong> ${curp.toUpperCase()}</p>
                <p><strong>Contraseña:</strong> (La contraseña que usted proporcionó durante el registro)</p>
            </div>

            <div style="border: 2px solid #e74c3c; background-color: #fbeae5; color: #c0392b; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold;">
                ADVERTENCIA: NO COMPARTAS ESTOS DATOS CON NADIE, SON CREDENCIALES ÚNICAS.
            </div>

            <p style="margin-top: 20px;"><strong>Liga de acceso:</strong> <a href="${homeLink}">Sistema de Avisos de Arribo Pesqueros</a></p>
            <hr>
            <p style="font-size: 0.9em; color: #555;">
                Los servidores públicos de la <strong>SEDARPA</strong> lo felicitamos por su responsabilidad y si necesita apoyo o tiene dudas con el proceso de captura de los avisos de arribo, comuníquese por favor a la Dirección General de Pesca y Acuacultura, teléfono (228) 8 40 02 57, línea directa.
            </p>
        </div>
        `;
        // --- FIN DE LA CORRECCIÓN ---

        // (Toda la lógica de Brevo sigue igual)
        let apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
        let sendSmtpEmail = new brevo.SendSmtpEmail(); 
        sendSmtpEmail.subject = "Datos de acceso - Sistema de Avisos de Arribo Pesqueros";
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
        sendSmtpEmail.to = [ { email: email } ];

        apiInstance.sendTransacEmail(sendSmtpEmail)
            .then(function(data) {
                console.log('Correo de bienvenida enviado por Brevo. ID: ' + data.messageId);
            })
            .catch(function(error) {
                console.error("Error al enviar correo de bienvenida con Brevo:", error.response ? error.response.body : error.message);
            });
        // --- FIN DEL REEMPLAZO ---

        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error("Error en registerUser:", error);
        res.status(500).json({ message: "Error en el servidor al registrar." });
    }
};

exports.loginUser = async (req, res) => {
    // --- AÑADIDO: Bloque de validación ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const { curp, password } = req.body;
        const user = await userModel.findUserByCurp(curp);

        if (user && await bcrypt.compare(password, user.password)) {
            const token = generateToken(user.id);
            res.status(200).json({
                message: 'Inicio de sesión exitoso.',
                token,
                user: { curp: user.curp, email: user.email, rol: user.rol }
            });
        } else {
            res.status(401).json({ message: 'CURP o contraseña incorrectos.' });
        }
    } catch (error) {
        console.error("Error en loginUser:", error);
        res.status(500).json({ message: "Error en el servidor al iniciar sesión." });
    }
};

exports.forgotPassword = async (req, res) => {
    // --- AÑADIDO: Bloque de validación ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const { email } = req.body;
        const user = await userModel.findUserByEmail(email);
        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = Date.now() + 15 * 60 * 1000;
            await userModel.saveResetToken(email, token, expires);

            const resetLink = `${CLIENT_URL}/reset-password.html?token=${token}`;

            // (Toda la lógica de Brevo sigue igual)
            let apiInstance = new brevo.TransactionalEmailsApi();
            apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
            let sendSmtpEmail = new brevo.SendSmtpEmail();
            sendSmtpEmail.subject = "Recuperación de Contraseña";
            sendSmtpEmail.htmlContent = `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${resetLink}">Restablecer Contraseña</a><p>El enlace expira en 15 minutos.</p>`;
            sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
            sendSmtpEmail.to = [ { email: email } ];

            apiInstance.sendTransacEmail(sendSmtpEmail)
                .then(function(data) {
                    console.log('Correo de recuperación enviado por Brevo. ID: ' + data.messageId);
                })
                .catch(function(error) {
                    console.error("Error al enviar correo de recuperación con Brevo:", error.response ? error.response.body : error.message);
             });
            // --- FIN ---
        }
        // Se responde 200 incluso si el email no existe para no dar pistas a atacantes
        res.status(200).json({ message: 'Si tu correo está registrado, recibirás un enlace.' });
    } catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
};

exports.resetPassword = async (req, res) => {
    // --- AÑADIDO: Bloque de validación ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const { token, newPassword } = req.body;
        const tokenData = await userModel.findTokenData(token);
        if (!tokenData || new Date(tokenData.expires).getTime() < Date.now()) {
            return res.status(400).json({ message: 'Token inválido o expirado.' });
     }
        await userModel.updateUserPassword(tokenData.email, newPassword);
        await userModel.deleteResetToken(token);
        res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
    } catch (error) {
        console.error("Error en resetPassword:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
};