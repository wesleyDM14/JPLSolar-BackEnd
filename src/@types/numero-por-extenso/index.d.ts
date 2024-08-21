interface ExtensoOptions {
    estilo?: 'monetario' | 'porcentagem' | 'ordinal' | 'unidade';
    genero?: 'masculino' | 'feminino';
}

declare module 'numero-por-extenso' {
    function extenso(value: number | string, options?: ExtensoOptions): string;

    export default extenso;
}