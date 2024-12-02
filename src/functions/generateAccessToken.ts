import { sign } from "jsonwebtoken";

export const generateAccessToken = (userId: string): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    return sign({ id: userId }, secret, { expiresIn: '30d' });
}