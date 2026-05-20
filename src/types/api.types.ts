interface ApiResponse<T> {
  sucesso: boolean;
  mensagem?: string;
  dados?: T;
  erro?: string;
}

// Define o formato de erro esperado
interface ErroValidacao {
  campo: string;
  mensagem: string;
}