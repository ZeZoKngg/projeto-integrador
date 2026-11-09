
-- ==========================================
-- LAUNCHCONTROL
-- CONSULTA E VERIFICAÇÃO DO BANCO DE DADOS
-- ==========================================

-- Seleciona o banco de dados do sistema.
USE launchcontrol;

-- Exibe todas as tabelas existentes no banco.
SHOW TABLES;

-- Conta a quantidade de usuários cadastrados.
SELECT COUNT(*) AS usuarios
FROM usuarios;

-- Conta a quantidade de veículos cadastrados.
SELECT COUNT(*) AS veiculos
FROM veiculos;

-- Conta a quantidade de solicitações de serviços.
SELECT COUNT(*) AS solicitacoes
FROM solicitacoes;

-- Conta a quantidade de orçamentos registrados.
SELECT COUNT(*) AS orcamentos
FROM orcamentos;

-- Conta a quantidade de mensagens dos atendimentos.
SELECT COUNT(*) AS mensagens
FROM mensagens_atendimento;
