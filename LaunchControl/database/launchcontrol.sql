
-- ==========================================
-- LAUNCHCONTROL
-- CRIAÇÃO E CONFIGURAÇÃO DO BANCO DE DADOS
-- ==========================================

-- Cria o banco de dados caso ele ainda não exista.
-- Utiliza UTF-8 para suportar acentos e caracteres especiais.
CREATE DATABASE IF NOT EXISTS launchcontrol
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Seleciona o banco LaunchControl para executar os próximos comandos.
USE launchcontrol;

