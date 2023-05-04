const functions = require("firebase-functions");
const puppeteer = require('puppeteer');
const admin = require('firebase-admin');
const dayjs = require("dayjs");

require('dotenv').config();

admin.initializeApp();

const isDev = process.argv[2];

const RECREATION_GOV_EMAIL = process.env.RECREATION_GOV_EMAIL;
const RECREATION_GOV_PASSWORD = process.env.RECREATION_GOV_PASSWORD;
const FIRST_NAME = process.env.FIRST_NAME;
const LAST_NAME = process.env.LAST_NAME;
const CREDIT_CARD_NUMBER = process.env.CREDIT_CARD_NUMBER;
const CREDIT_CARD_EXPIRATION_MONTH = process.env.CREDIT_CARD_EXPIRATION_MONTH;
const CREDIT_CARD_EXPIRATION_YEAR = process.env.CREDIT_CARD_EXPIRATION_YEAR;
const CREDIT_CARD_SECURITY_CODE = process.env.CREDIT_CARD_SECURITY_CODE;

async function reserveRedRockTimedEntryPass(
  page, 
  date, 
  time, 
  firstName, 
  lastName, 
  creditCardNumber,
  creditCardExpirationMonth,
  creditCardExpirationYear,
  creditCardSecurityCode
  ) {
  // Navigate to a webpage
  await page.goto('https://www.recreation.gov/timed-entry/10075177/ticket/10075178');

  const dateElement = await page.waitForSelector('#tourCalendarWithKey');
  await dateElement.type(date)

  const quantityElement = await page.$('#guest-counter');
  await quantityElement.click();

  const personalVehicleCountElement = await page.$('input[aria-label="Number of Personal Vehicles"]');
  await personalVehicleCountElement.press('Backspace')
  await personalVehicleCountElement.type("1");
  await page.keyboard.press('Tab');

  const entryTimeElement = await page.waitForSelector(`input[value="${time}"]`);

  entryTimeElement.press('Space');

  const requestTicketsSubmitButtonElement = await page.waitForSelector('#request-tickets');
  await requestTicketsSubmitButtonElement.click();

  const addAPassButtonElement = await page.waitForSelector('.sarsa-button.sarsa-button-secondary.sarsa-button-md');
  await addAPassButtonElement.click();

  const passElement = await page.$('input[value="SITE_PASS"]');
  await passElement.press('Space');

  const agreementInputElement = await page.$('#need-to-know-checkbox');
  await agreementInputElement.press('Space');

  const proceedToCardButtonElement = await page.waitForSelector('.sarsa-button.sarsa-button-primary.sarsa-button-md');
  await proceedToCardButtonElement.click();

  const continueToPaymentbuttonElement = await page.waitForSelector('.cart-order-summary-actions .rec-button-primary-large');
  await continueToPaymentbuttonElement.click();

  const paymentFirstNameInputElement = await page.waitForSelector('input[aria-label="First Name"]');
  await paymentFirstNameInputElement.type(firstName);
  const paymentLastNameInputElement = await page.$('input[aria-label="Last Name"]');
  await paymentLastNameInputElement.type(lastName);
  const paymentCreditCardNumberInputElement = await page.$('input[aria-label="Card Number"]');
  await paymentCreditCardNumberInputElement.type(creditCardNumber);
  const paymentCreditCardExpirationMonthSelectElement = await page.$('select[name="month"]');
  await paymentCreditCardExpirationMonthSelectElement.select(creditCardExpirationMonth);
  const paymentCreditCardExpirationYearSelectElement = await page.$('select[name="year"]');
  await paymentCreditCardExpirationYearSelectElement.select(creditCardExpirationYear);
  const paymentCreditCardSecurityCodeInputElement = await page.$('input[aria-label="CVC"]');
  await paymentCreditCardSecurityCodeInputElement.type(creditCardSecurityCode);

  await paymentFirstNameInputElement.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  await sleep(500);

  const nextButtonElement = await page.$('.sarsa-button.mb-2.sarsa-button-primary.sarsa-button-lg');
  await nextButtonElement.click();
  
  // const confirmButtonElement = await page.waitForSelector('sarsa-button ml-1 sarsa-button-primary sarsa-button-md');
  // await confirmButtonElement.click();

  // const orderNumberElement = await page.waitForSelector('.cartoc-ordernum .h3');
  // const orderNumberString = await page.evalulate(el => el.innerText, orderNumberElement);
  
  // return {
  //   order_number: orderNumberString
  // };

}

async function removeAnyExistingCartReservations(page) {
  await page.goto('https://www.recreation.gov/cart');

  await sleep(1000);

  const isCartEmpty = await page.$('.cart-empty-body');

  if(!isCartEmpty) {
    const addFiveMoreMinutesIgnoreButtonElement = await page.$('button[aria-label="Ignore"]');

    if(addFiveMoreMinutesIgnoreButtonElement) {
      await addFiveMoreMinutesIgnoreButtonElement.click();
    }

    const removeReservationButtons = await page.$$('button[aria-label="Remove Reservation"]');
  
    if(removeReservationButtons && removeReservationButtons.length > 0) {
      for(const removeReservationButton of removeReservationButtons) {
        await removeReservationButton.click();
        await sleep(500);
        const yesConfirmationButtonElement = await page.$('.sarsa-modal .sarsa-button.sarsa-button-primary.sarsa-button-md');
        await yesConfirmationButtonElement.click();
        await sleep(500);
      }
    }
  } else {
    console.log('Cart is empty');
  }
}

async function loginToRecreationGov(page, email, password) {
  // Navigate to receation.gov
  await page.goto('https://www.recreation.gov/log-in', { waitUntil: 'networkidle2' });

  // Get a reference to the element with id "email"  
  const emailElement = await page.waitForSelector('#email');
  await emailElement.type(email);
  
  const passwordElement = await page.$('#rec-acct-sign-in-password');
  await passwordElement.type(password);
  
  const submitButton = await page.$('button[type="submit"]');
  
  // Click the button
  await submitButton.click();
  
  await page.waitForSelector('button[aria-label="My Account"]');
}

async function getRedRockTimedEntryPassAvailability(page) {
    // https://www.recreation.gov/api/timedentry/availability/facility/10075177?date=2023-05-03
    // https://www.recreation.gov/api/timedentry/availability/facility/10075177?date=2023-05-03
}

async function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  })
}

exports.redRockTimeEntryPassAvailability = functions.https.onRequest((req, res) => {
  res.send('Hello, World!');
});

exports.reserveRedRockTimedEntryPass = functions.https.onRequest(async (req, res) => {
    if(req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
    }

    const token = req.headers.authorization;
    
    try {
      await admin.auth().verifyIdToken(token)
    } catch (error) {
      res.status(401).send('Unauthorized');
      return;
    }

    const body = req.body;

    if(!body.date) {
      res.status(422).send('date body parameter is required and must be in the MM/DD/YYYY format. ex. 05/04/2023');
      return;
    }

    if(!body.time) {
      res.status(422).send('time body parameter is required and must be in the HH00 24-hour format. ex. 0800');
      return;
    }

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await loginToRecreationGov(page, RECREATION_GOV_EMAIL, RECREATION_GOV_PASSWORD);
    await removeAnyExistingCartReservations(page);
    const date = body.date;
    const time = body.time;

    const reservation = await reserveRedRockTimedEntryPass(
      page,
      date,
      time,
      FIRST_NAME,
      LAST_NAME,
      CREDIT_CARD_NUMBER,
      CREDIT_CARD_EXPIRATION_MONTH,
      CREDIT_CARD_EXPIRATION_YEAR,
      CREDIT_CARD_SECURITY_CODE);

    res.send(reservation);
});

if(isDev) {
    (async () => {
        // const browser = await puppeteer.launch({ headless: false });
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        let startSeconds = dayjs().unix();
        await loginToRecreationGov(page, RECREATION_GOV_EMAIL, RECREATION_GOV_PASSWORD);
        let endSeconds = dayjs().unix();
        console.log('Login took ' + (endSeconds - startSeconds) + ' seconds');
        startSeconds = dayjs().unix();
        await removeAnyExistingCartReservations(page);
        endSeconds = dayjs().unix();
        console.log('clearing cart took ' + (endSeconds - startSeconds) + ' seconds');

        const tomorrow = dayjs().add(1, 'day');
        const date = tomorrow.format('MM/DD/YYYY'); // ex 05/04/2023
        const time = '0900';
        startSeconds = dayjs().unix();
        const reservation = await reserveRedRockTimedEntryPass(
          page,
          date,
          time,
          FIRST_NAME,
          LAST_NAME,
          CREDIT_CARD_NUMBER,
          CREDIT_CARD_EXPIRATION_MONTH,
          CREDIT_CARD_EXPIRATION_YEAR,
          CREDIT_CARD_SECURITY_CODE);
          endSeconds = dayjs().unix();
          console.log('reservation took ' + (endSeconds - startSeconds) + ' seconds');
        // console.log(JSON.stringify(reservation));
    })();
}