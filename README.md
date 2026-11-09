
# 🏎️ LaunchControl

### Sistema de Gestão e Atendimento Automotivo

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Projeto Integrador | Desenvolvimento Web | Engenharia de Software**

O LaunchControl é uma plataforma web desenvolvida para facilitar a comunicação entre clientes, oficinas automotivas e fornecedores, reunindo processos de atendimento, manutenção e gerenciamento de serviços em um único ambiente.

> 🚧 Projeto acadêmico em desenvolvimento. Algumas funcionalidades ainda estão em fase de implementação e testes.

---

## 📖 Sobre o projeto

A proposta do LaunchControl surgiu da necessidade de tornar o atendimento automotivo mais organizado, acessível e eficiente.

Em muitas situações, clientes encontram dificuldades para acompanhar o andamento de serviços, consultar orçamentos e manter contato com oficinas.

Pensando nisso, desenvolvemos uma aplicação que busca centralizar essas informações, proporcionando maior transparência durante o atendimento e facilitando o trabalho dos profissionais envolvidos.

O sistema foi estruturado com uma arquitetura web, utilizando Java e Spring Boot no backend, JavaScript no frontend e MySQL para persistência das informações.

## 🎯 Objetivos

- Centralizar informações de clientes, veículos e serviços.
- Facilitar a comunicação entre clientes e oficinas.
- Organizar solicitações e orçamentos automotivos.
- Permitir o acompanhamento das etapas de manutenção.
- Disponibilizar diferentes perfis de acesso.
- Melhorar a experiência de utilização por meio de uma interface responsiva.
- Aplicar conceitos de programação orientada a objetos, persistência de dados e segurança.

---

## ⚙️ Funcionalidades do sistema

O LaunchControl contempla diferentes módulos para atender às necessidades dos usuários.

### 👤 Gestão de usuários

- Cadastro e autenticação de usuários.
- Diferenciação de acesso por perfis.
- Armazenamento seguro de senhas utilizando BCrypt.
- Recuperação de senha por e-mail, em fase de testes.

### 🚗 Gestão de veículos

- Cadastro de veículos vinculados aos clientes.
- Registro de modelo, ano, placa e quilometragem.
- Consulta de veículos cadastrados.

### 🔧 Solicitações de serviços

- Abertura de solicitações de atendimento.
- Descrição dos problemas apresentados pelo veículo.
- Associação entre cliente, veículo e oficina.
- Acompanhamento dos status de atendimento.
- Registro de laudos e observações técnicas.

### 💰 Orçamentos

- Registro dos valores de peças e mão de obra.
- Aplicação de descontos e valores adicionais.
- Definição do prazo estimado para o serviço.
- Histórico de informações dos orçamentos.
- Controle de aprovação das solicitações.

### 📦 Fornecedores e peças

- Cadastro de peças por fornecedores.
- Controle de preços e quantidades.
- Consulta de peças disponíveis.

### 💬 Comunicação e acompanhamento

- Troca de mensagens durante o atendimento.
- Envio de anexos relacionados às solicitações.
- Registro do diário de manutenção.
- Notificações para os usuários.
- Avaliação dos serviços realizados.

A disponibilidade de cada recurso depende da etapa atual de desenvolvimento e integração do projeto.

---

## 🛠️ Tecnologias utilizadas

| Área | Tecnologia | Utilização |
|---|---|---|
| Backend | Java 17 | Regras de negócio e processamento |
| Framework | Spring Boot 3.3.5 | Desenvolvimento da aplicação web |
| Segurança | Spring Security | Autenticação e proteção das rotas |
| Persistência | Spring Data JPA | Comunicação com o banco |
| ORM | Hibernate | Mapeamento das entidades |
| Banco de dados | MySQL | Armazenamento das informações |
| Frontend | HTML5 | Estrutura das páginas |
| Estilização | CSS3 | Layout e responsividade |
| Interatividade | JavaScript | Integração da interface com a API |
| Dependências | Maven | Gerenciamento e execução |
| Versionamento | Git e GitHub | Controle de versões |
| Desenvolvimento | Visual Studio Code | Edição e organização do código |

---

## 🏗️ Arquitetura e organização

O projeto utiliza uma estrutura com frontend, backend e banco de dados.

```text
LaunchControl/
│
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/
│           │   └── br/com/launchcontrol/
│           │       ├── LaunchControlApplication.java
│           │       ├── Repositories.java
│           │       ├── SecurityConfig.java
│           │       └── RecuperacaoSenhaService.java
│           │
│           └── resources/
│               ├── application.properties
│               └── static/
│                   ├── index.html
│                   ├── style.css
│                   └── app.js
│
├── database/
│
├── index.html
├── style.css
├── app.js
└── INICIAR-LAUNCHCONTROL.bat
```

A estrutura acima apresenta os principais arquivos e diretórios, sem listar todas as classes do backend.

### Como as partes se comunicam?

1. O usuário acessa a interface web.
2. O JavaScript realiza requisições para o backend.
3. O Spring Boot recebe e processa as solicitações.
4. Os repositórios JPA realizam operações no MySQL.
5. O backend retorna os resultados para a interface.

Essa organização facilita a manutenção do código e a separação das responsabilidades.

---

## 🚀 Como executar o projeto

### Pré-requisitos

Antes de iniciar, verifique se estão instalados:

- Java JDK 17 ou superior compatível.
- Apache Maven.
- MySQL Server.
- Git.
- Visual Studio Code ou outra IDE Java.

### 1. Clonar o repositório

Abra o terminal e execute:

```bash
git clone https://github.com/ZeZoKngg/projeto-integrador.git
```

Entre na pasta do projeto:

```bash
cd projeto-integrador
cd LaunchControl
```

### 2. Configurar o banco de dados

Inicie o MySQL e configure as credenciais no arquivo:

```text
backend/src/main/resources/application.properties
```

A aplicação utiliza o banco `launchcontrol`.

A conexão pode ser configurada por meio das variáveis de ambiente `DB_URL`, `DB_USER` e `DB_PASSWORD`.

### 3. Configurar a recuperação de senha

Para utilizar o envio de e-mails, configure as variáveis:

```text
MAIL_USERNAME
MAIL_PASSWORD
```

O projeto utiliza SMTP para enviar os links de recuperação.

Essa configuração é necessária para testar a funcionalidade de redefinição de senha.

### 4. Iniciar o backend

No terminal, acesse:

```bash
cd backend
```

Execute:

```bash
mvn spring-boot:run
```

A aplicação deverá iniciar na porta 8080, desde que as dependências e a conexão com o banco estejam configuradas corretamente.

### 5. Acessar o sistema

Abra o navegador e utilize:

http://localhost:8080

No Windows, também existe o arquivo:

```text
INICIAR-LAUNCHCONTROL.bat
```

Ele permite iniciar o backend, desde que Java e Maven estejam disponíveis no sistema.

---

## 🔐 Segurança

O LaunchControl utiliza recursos do Spring Security para implementar autenticação e proteção de acesso.

Entre os mecanismos presentes no projeto estão:

- Codificação de senhas utilizando BCrypt.
- Autenticação HTTP Basic.
- Identificação dos perfis dos usuários.
- Proteção de rotas que exigem autenticação.
- Configuração de CORS para desenvolvimento local.
- Recuperação de senha com tokens temporários.
- Armazenamento do hash dos tokens de recuperação.

As configurações atuais são voltadas ao desenvolvimento e devem ser revisadas antes de uma implantação em produção.

---

## 📚 Conceitos aplicados

Durante o desenvolvimento do LaunchControl, foram utilizados conhecimentos trabalhados ao longo do curso, incluindo:

- Programação orientada a objetos.
- Classes, atributos, métodos e construtores.
- Interfaces e enumerações.
- Relacionamentos entre entidades.
- Persistência de dados com JPA.
- Desenvolvimento de APIs.
- Autenticação e autorização.
- Tratamento de exceções.
- Organização do código em diferentes responsabilidades.
- Integração entre frontend e backend.
- Versionamento e colaboração com Git.

O projeto também contribui para a experiência prática de análise, implementação, testes e manutenção de software.

---

## 👥 Equipe de desenvolvimento

| Integrante | GitHub |
|---|---|
| Gabriel Teodoro | [@GabrielTeodoro7](https://github.com/GabrielTeodoro7) |
| Ana Letícia | [@Anapimentel18](https://github.com/Anapimentel18) |
| Miguel Luiz | [@ZeZoKngg](https://github.com/ZeZoKngg) |

Projeto desenvolvido em grupo como parte das atividades acadêmicas do Projeto Integrador.

---

## 📈 Status e evolução

**Status atual: Em desenvolvimento**

O LaunchControl continua passando por melhorias e ajustes, principalmente nas áreas de integração, autenticação, recuperação de senha, interface e gerenciamento das solicitações.

As próximas etapas envolvem a conclusão dos testes, correção de problemas identificados e validação das funcionalidades desenvolvidas.

---

## 🔗 Repositório

O código-fonte está disponível em:

[github.com/ZeZoKngg/projeto-integrador](https://github.com/ZeZoKngg/projeto-integrador)

---

<p align="center">
  <strong>LaunchControl — Tecnologia aplicada ao atendimento automotivo.</strong>
</p>

<p align="center">
  Projeto Integrador • 2026
</p>
