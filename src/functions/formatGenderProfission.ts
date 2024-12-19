import { EstadoCivil, Genero } from "@prisma/client";

export const formatGenderStringEstadoCivil = (genero: Genero, estadoCivil: EstadoCivil) => {

    switch (estadoCivil) {
        case 'CASADO':
            if (genero === "FEMININO") {
                return 'CASADA'
            }
        case 'DIVORCIADO':
            if (genero === "FEMININO") {
                return 'DIVORCIADA'
            }
        case 'SEPARADO':
            if (genero === "FEMININO") {
                return 'SEPARADA'
            }
        case 'SOLTEIRO':
            if (genero === "FEMININO") {
                return 'SOLTEIRA'
            }
        case "VIUVO":
            if (genero === "FEMININO") {
                return 'VIUVA'
            }
        default:
            break;
    }

    return estadoCivil;
}