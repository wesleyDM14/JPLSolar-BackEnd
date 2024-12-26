import axios from "axios";

export const testAuthentication = async () => {
    await axios.post('https://api-parceiro.sicredi.com.br/sb/auth/openapi/token', {
        grant_type: 'password',
        username: '123456789',
        password: 'teste123',
        scope: 'cobranca',
    }, {
        headers: {
            'x-api-key': process.env.SICREDI_TOKEN,
            context: 'COBRANCA',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    }).then((response) => {
        console.log(response.data);
    }).catch((err) => {
        console.error(err);
    });
}