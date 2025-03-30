#!/bin/bash
# Обновление Netlify CLI до последней версии
npm install -g netlify-cli@latest

# Обновление локального пакета
npm update netlify-cli --save-dev

# Очистка кэша npm
npm cache clean --force

echo "Netlify CLI обновлен до последней версии"
