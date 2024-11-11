export const formatCEP = (cep: string) => {
    return cep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
}

export const formatCPF = (cpf: string) => {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export const formatRG = (rg: string) => {
    return rg.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3");
}

export const formatPhone = (phone: string) => {
    return phone.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, "($1) $2 $3-$4");
}