const express = require('express');
const expressApp = express()
const axios = require("axios");
const path = require("path")
const { v4: uuidv4 } = require('uuid');
const {MakeP2P} = require("./service/PAGO_P2P")

const port = process.env.PORT || 3000;

expressApp.use(express.static('static'))
expressApp.use(express.json());
require('dotenv').config();

const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

expressApp.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});



bot.command('help', async (ctx) => {
  await ctx.reply(`Hola el formato para realizar un pago es el siguiente:`);
  await ctx.reply(`telefono, número de cédula (sin puntos), codigo del banco, monto (decimales separados por coma ,) , nombre del beneficiario, descripción del pago (opcional) , descripción del pago (opcional)`);
  await ctx.reply(` 0424xxxxxxx \n  xxxxxxxx \n 0102 \n 10,00 \n Pepito Perez \n pago`);
})

bot.on('text', async (ctx) => {
  const mensaje = ctx.update.message.text;
  // separar el mensaje en un array de palabras por los saltos de linea
  const data_separada = mensaje.split('\n');
  
  const data_pago = {
    id_transaccion: uuidv4(),
    phone: data_separada[0],
    card_ci:data_separada[1],
    bank:data_separada[2],
    amount:data_separada[3],
    name:data_separada[4] ? data_separada[4] : false,
    description:data_separada[5] ? data_separada[5] : false

  }



  ctx.reply('Realizando pago movil..')
  await MakeP2P(data_pago);
  await bot.telegram.sendPhoto(ctx.chat.id, {
    source: `./screenshots/${data_pago.id_transaccion}.png`
  });

  ctx.reply(`Pago realizado con exito el id de capture es ${data_pago.id_transaccion}`);


  

})




bot.launch()
