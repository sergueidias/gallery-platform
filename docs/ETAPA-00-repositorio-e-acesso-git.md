# ETAPA 00 — Repositório e acesso Git

## Objetivo
Preparar o repositório do projeto gallery-platform com versionamento Git e integração segura com GitHub via SSH.

## O que foi feito
- criação da pasta /opt/gallery-platform
- inicialização do repositório Git no diretório correto
- criação do repositório remoto no GitHub
- configuração de autenticação SSH dedicada no VPS
- primeiro commit e primeiro push para a branch main

## Problema encontrado
Inicialmente o git foi executado por engano em /root, o que criou um repositório indevido contendo arquivos sensíveis do usuário root.

## Correção aplicada
- remoção segura de /root/.git
- recriação do repositório apenas em /opt/gallery-platform

## Estado final
- repositório remoto ativo
- branch main publicada
- autenticação SSH funcional no VPS
- base pronta para uso com Codex sem interferir em outros serviços
