# Festly - Gestão de Eventos em um só lugar

O **Festly** é uma plataforma centralizada para contratação de serviços para festas, cerimônias e eventos. O projeto utiliza uma arquitetura moderna com **Spring Boot** no backend e **React (Vite)** no frontend.

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina (Ubuntu/Linux recomendado):
* **Java 21** (ou 17)
* **Node.js** (versão 18+) & **npm**
* **Docker** & **Docker Compose**

---

## Como Rodar o Projeto

Siga os passos abaixo na ordem indicada para garantir que a comunicação entre os serviços funcione corretamente.

### 1. Configuração do Banco de Dados (Backend)
O banco de dados PostgreSQL roda via Docker para facilitar a configuração do ambiente.

1. Navegue até a pasta do backend:
   ```bash
   cd festly-backend
   ```
   
2. Suba o container do banco:
   ```bash
   docker compose up -d
   ```
  O banco estará disponível na porta 5432

3. Execute o projeto Spring boot:
    ```bash
   ./mvnw spring-boot:run
   ```

### 2. Configuração do Frontend
O banco de dados PostgreSQL roda via Docker para facilitar a configuração do ambiente.

1. Abra um novo terminal e navegue até a pasta do frontend::
   ```bash
   cd festly-frontend
   ```
2. Instale as dependências caso não as tenha instalado:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
    ```bash
   npm run dev
   ```
   
