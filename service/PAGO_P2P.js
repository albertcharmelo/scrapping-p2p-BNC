// Include fs module
const fs = require('fs');
const { chromium } = require("playwright");
require('dotenv').config();
// Credenciales
const CARD_ID = process.env.CARD_ID;
const CARD_NUMBER = process.env.CARD_NUMBER;
const CARD_PASSWORD = process.env.CARD_PASSWORD;
// Coordenadas (opcionales)
const json_coordenadas = fs.readFileSync('./assets/coordenadas.json');
const coordenadas = JSON.parse(json_coordenadas);
const CONTROL_NUMBER = '58652066'
//obtener bancos del json ubicado en assets/bancos.json
const json_bancos = fs.readFileSync('./assets/banks.json');
const BANKS = JSON.parse(json_bancos);


// Datos del Pago

let DATA_P2P = {
    name: "Nombre de transacción",
    card_ci:{
      type: "V",
      number: "numero de cedula"
    },
    phone: {
      code: "codigo de area ej 0424 - 0412 - 0416 - 0426",
      number: "numero de telefono"
    },
    bank:{
      code: "codigo de banco ej 0134 - 0102",
      name: "Nombre del banco"
    },
    amount: "monto en el formato xx,xx",
    description: "descripcion del pago"
}



 async function MakeP2P(DATA_PAGO) {

  await construir_datos(DATA_PAGO);

  console.log(DATA_P2P);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await Login(CARD_NUMBER, CARD_ID, CARD_PASSWORD,page);
  await P2P(DATA_P2P, CONTROL_NUMBER,page);
  // Comprobante de pago
  await page.screenshot({ path: `screenshots/PayTo${DATA_P2P.capture_transaccion}.png` });
  // Cerrar el navegador
  await page.evaluate(() => {
    document.getElementById("btn-logout").click();
    document.getElementById("Mdl-Confirm-Yes").click();
  });

  await browser.close();
}




async function Login(card_number, card_id , password,page){

  await page.goto("https://personas.bncenlinea.com/");

  
  await page.evaluate((data) => {
    document.getElementById("CardNumber").value = data.card_number; // numero de tarjeta
    document.getElementById("UserID").value = data.card_id; // ID cedula
    document.getElementById("BtnSend").click();
  },{
    card_number,
    card_id
  });

  await page.waitForTimeout(5000);

  
  await page.evaluate((password) => {
    document.getElementById("UserPassword").value = password; // contraseña
    document.getElementById("BtnSend").click();
  },password);

  await page.waitForTimeout(5000);

}


async function P2P(data_p2p , control_number,page ){
  await page.goto('https://personas.bncenlinea.com/Payments/P2P/Emission'); // Entrar al P2P
  
  await page.waitForTimeout(3000);

  await page.evaluate( async (data_p2p) => {
    console.log(data_p2p.option_banco,data_p2p.opcion_codArea)
    document.getElementById('BNR').click() // Pestaña de P2P sin Registrar
    document.getElementById('bs-select-1-1').click() // Cuenta Ahorro Principal
    document.getElementById(data_p2p.option_banco).click() // Tipo de Cuenta Corriente
    document.getElementById('prv_Beneficiary_ID').value = data_p2p.data.card_ci.number // Cedula del beneficiario
    document.getElementById('Beneficiary_Name').value = data_p2p.data.name // Nombre del beneficiario
    document.getElementById('Amount').value = String(data_p2p.data.amount); // Monto a enviar
    document.getElementById('Concept').value = data_p2p.data.description // Concepto
    document.getElementById(data_p2p.opcion_codArea).click() // Seleccion del numero de operadora ej 0424
    document.getElementById('prv_Beneficiary_PhoneNumber').value = data_p2p.data.phone.number // 7 digitos del numero de telefono
    document.getElementById('BtnContinue').click() // Continuar
  },{data:data_p2p, option_banco: seleccionarBanco(data_p2p.bank.code), opcion_codArea: seleccionarCodigoArea(data_p2p.phone.code)});


  await page.waitForTimeout(3000);

  await page.evaluate(() => {
    document.querySelector('button[type="submit"]').click()
  });

  await page.waitForTimeout(3000);

  await page.evaluate((control_number) => {
    document.querySelector('button[type="submit"]').click()
    document.getElementById('ControlNumber').value = control_number; // Numero de control
    document.querySelector('button[data-action="authfactor-send"]').click()
  },control_number);


  await page.waitForTimeout(3000);
}

module.exports = {
  MakeP2P
}



async function construir_datos(data){
  const BANCO_BUSCADO = await buscar_banco(data.bank);
  DATA_P2P.name = data.name ? data.name : 'PAGO PERSONA P2P';
  DATA_P2P.card_ci.number = data.card_ci
  DATA_P2P.card_ci.type = 'V'
  DATA_P2P.phone.code = data.phone.substring(0,4);
  DATA_P2P.phone.number = data.phone.substring(4,11);
  DATA_P2P.bank.code = BANCO_BUSCADO.id;
  DATA_P2P.bank.name = BANCO_BUSCADO.name;
  DATA_P2P.amount = String(data.amount).replace('.',',');
  DATA_P2P.description = data.description ? data.description : 'Pago';
  DATA_P2P.capture_transaccion = data.id_transaccion ;
}


function buscar_banco(banco){
  let bank = BANKS.banks.find(bank => bank.name == banco || bank.id == banco);
  return bank
}


 function seleccionarBanco(code){
  switch (code) {
    case '0102':
      return 'bs-select-3-23'
      break;
    case '0134':
      return 'bs-select-3-8'
      break;
    case '0105':
      return 'bs-select-3-16'
      break;
    case '0108':
      return 'bs-select-3-19'
      break;
    case '0191':
      return 'bs-select-3-1'
      break;
    case '0114':
      
      return 'bs-select-3-2'
    break;
    case '0175':
      
      return 'bs-select-3-12'
    break;
    case '0104':
      
      return 'bs-select-3-22'
    break;
    case '0172':
      
      return 'bs-select-3-4'
    break;
    default:
      break;
  }
}

 function seleccionarCodigoArea(code){
  switch (code) {
    case '0412':
      return 'bs-select-4-0'
      break;
    case '0414':
      return 'bs-select-4-1'
      break;
    case '0424':
      return 'bs-select-4-2'
      break;
    case '0416':
      return 'bs-select-4-3'
      break;
    case '0426':
      return 'bs-select-4-4'
    break;
    default:
      break;
  }

}