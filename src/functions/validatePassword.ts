import { hash } from "bcryptjs";

export function validatePassword(password: string, confirmPassword: string): void {
    if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem.');
    }
    const minimunLength = 8;
    if (password.length < minimunLength) {
        throw new Error(`A senha deve ter pelo menos ${minimunLength} caracteres.`);
    }
}