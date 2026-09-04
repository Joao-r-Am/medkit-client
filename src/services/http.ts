import axios from "axios";

// Instância pura; interceptadores são registrados em src/boot/axios.ts.
// A CLI (@quasar/app-vite 3.x) expõe ao cliente apenas variáveis com prefixo QCLI_
// (quasar.config > build.env.clientPrefix).
const httpClient = axios.create({
  baseURL: import.meta.env.QCLI_API_BASE_URL ?? ""
});

export default httpClient;
