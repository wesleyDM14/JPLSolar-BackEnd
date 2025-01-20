import crypto from 'crypto';

export function encryptPassword(text: string): { encrypted: string; iv: string } {

    try {
        if (!process.env.ENCRYPTION_KEY) {
            throw new Error('Chave de criptografia não encontrada.');
        }

        const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

        const ivLength = 12;

        const iv = crypto.randomBytes(ivLength);
        const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);

        const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return {
            encrypted: `${encrypted.toString('hex')}:${authTag.toString('hex')}`,
            iv: iv.toString('hex')
        }
    } catch (error) {
        console.error('Erro ao criptografar: ', error);
        throw error;
    }
}

export function decryptPassword(encryptedText: string, iv: string): string {
    try {
        if (!process.env.ENCRYPTION_KEY) {
            throw new Error('Chave de criptografia não encontrada.');
        }

        const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            encryptionKey,
            Buffer.from(iv, 'hex')
        );

        const [encrypted, authTag] = encryptedText.split(':');
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted, 'hex')),
            decipher.final(),
        ]);

        return decrypted.toString('utf-8');
    } catch (error) {
        console.error('Erro ao decriptar: ', error);
        throw error;
    }
}