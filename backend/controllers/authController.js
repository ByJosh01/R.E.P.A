// backend/controllers/authController.js
require('dotenv').config();
const userModel = require('../models/userModel');
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const brevo = require('@getbrevo/brevo');
// Nota: Ya no necesitamos importar validationResult aquí

// --- VALIDACIÓN PREVIA DE ENTORNO ---
if (!process.env.JWT_SECRET || !process.env.RECAPTCHA_SECRET_KEY) {
    console.error("❌ ERROR FATAL: Faltan variables de entorno críticas (JWT o RECAPTCHA).");
}

const JWT_SECRET = process.env.JWT_SECRET;
const secretKey = process.env.RECAPTCHA_SECRET_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL; 
const SENDER_NAME = "Sistema de Avisos REPA";
const CLIENT_URL = process.env.CLIENT_URL || "https://proyecto-repa.onrender.com"; 

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1d' });
};

exports.registerUser = async (req, res) => {
    // ¡MIRA QUÉ LIMPIO! Sin validaciones de formato aquí.
    try {
        let { curp, email, password, recaptchaToken } = req.body;
        
        // Sanitización extra por seguridad (aunque express-validator ya hizo gran parte)
        curp = curp ? curp.trim().toUpperCase() : '';
        email = email ? email.trim().toLowerCase() : '';

        // Validación de lógica de negocio (captcha)
        if (!recaptchaToken) { 
            return res.status(400).json({ message: 'Validación de seguridad (Captcha) faltante.' });
        }

        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
        const verificationResponse = await axios.post(verificationURL);
        if (!verificationResponse.data.success) {
            return res.status(400).json({ message: 'Falló la verificación de seguridad (Captcha).' });
        }

        // Verificar duplicados
        const [existingCurp, existingEmail] = await Promise.all([
            userModel.findUserByCurp(curp),
            userModel.findUserByEmail(email)
        ]);

        if (existingCurp || existingEmail) {
            return res.status(400).json({ message: 'El CURP o correo electrónico ya están registrados.' });
        }

        // Crear Usuario
        await userModel.createUser({ curp, email, password });

        // Enviar Correo
        sendWelcomeEmail(curp, email).catch(err => {
            console.error("⚠️ Advertencia: Usuario registrado pero falló el correo:", err.message);
        });

        res.status(201).json({ message: 'Registro exitoso. Revisa tu correo.' });

    } catch (error) {
        console.error("❌ Error crítico en registerUser:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

exports.loginUser = async (req, res) => {
    try {
        let { curp, password } = req.body;
        curp = curp ? curp.trim().toUpperCase() : '';

        const user = await userModel.findUserByCurp(curp);

        if (user && await bcrypt.compare(password, user.password)) {
            const token = generateToken(user.id);
            
            const userSafe = { 
                curp: user.curp, 
                email: user.email, 
                rol: user.rol 
            };

            res.status(200).json({
                message: 'Inicio de sesión exitoso.',
                token,
                user: userSafe
            });
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas.' });
        }
    } catch (error) {
        console.error("Error en loginUser:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        let { email } = req.body;
        email = email.trim().toLowerCase();

        const user = await userModel.findUserByEmail(email);
        
        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = Date.now() + 15 * 60 * 1000; // 15 min
            
            await userModel.saveResetToken(email, token, expires);
            
            const resetLink = `${CLIENT_URL}/reset-password.html?token=${token}`;
            sendRecoveryEmail(email, resetLink).catch(console.error);
        }
        
        // Respondemos siempre OK por seguridad
        res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones.' });
    } catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const tokenData = await userModel.findTokenData(token);

        if (!tokenData || new Date(tokenData.expires).getTime() < Date.now()) {
            return res.status(400).json({ message: 'El enlace ha expirado o es inválido.' });
        }

        await userModel.updateUserPassword(tokenData.email, newPassword);
        await userModel.deleteResetToken(token);

        res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        console.error("Error en resetPassword:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
};

// --- FUNCIONES AUXILIARES DE CORREO ---
async function sendWelcomeEmail(curp, email) {
    const homeLink = `${CLIENT_URL}/home.html`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #dc3545ff;">Bienvenido al Sistema de Avisos REPA</h2>
            <p>Sus datos de acceso han sido registrados.</p>
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #58171eff; margin: 20px 0;">
                <p><strong>CURP:</strong> ${curp}</p>
                <p><strong>Contraseña:</strong> (La que definió en su registro)</p>
            </div>
            <p>Por favor, no comparta sus credenciales.</p>
            <a href="${homeLink}" style="display: inline-block; background: #dc3545ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ingresar al Sistema</a>
        </div>
    `;

    let apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    let sendSmtpEmail = new brevo.SendSmtpEmail(); 
    sendSmtpEmail.subject = "Datos de Acceso - REPA";
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
    sendSmtpEmail.to = [ { email: email } ];

    return apiInstance.sendTransacEmail(sendSmtpEmail);
}

async function sendRecoveryEmail(email, link) {
    let apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Recuperación de Contraseña";
    sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial;">
            <h3>Recuperación de Contraseña</h3>
            <p>Haga clic en el siguiente botón para restablecer su contraseña (válido por 15 min):</p>
            <a href="${link}" style="background: #dc3545ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
        </div>`;
    sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
    sendSmtpEmail.to = [ { email: email } ];

    return apiInstance.sendTransacEmail(sendSmtpEmail);
}