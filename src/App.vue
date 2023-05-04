<template>
  <LoginForm v-if="!isLoading &&!user"/>
  <div v-if="!isLoading && user" class="welcome-message">Welcome back, {{ user.email }} <button @click="handleLogout" class="logout-button">Logout</button></div>
  <div v-if="!isLoading && user" class="timeslot-table">
    <div class="timeslot-table-section">
      <h3>TODAY</h3>
      <h4>{{ todayDateString }}</h4>
      <div class="entry-windows">
        <button 
          v-for="(timeslot, index) in todayPassAvailability" 
          :key="index" 
          class="timeslot-button"
          @click="() => handleReserveTimeslotClick(timeslot)"
        >
          <div class="timeslot-time">{{ timeslot.title }}</div>
          <div class="timeslot-remaining">({{ timeslot.remaining_passes }} left)</div>
        </button>
      </div>
    </div>
    <div class="timeslot-table-section">
      <h3>TOMORROW</h3>
      <h4>{{ tomorrowDateString }}</h4>
      <div class="entry-windows">
        <button 
          v-for="(timeslot, index) in tomorrowPassAvailability" 
          :key="index" 
          class="timeslot-button"
          @click="() => handleReserveTimeslotClick(timeslot)"
        >
          <div class="timeslot-time">{{ timeslot.title }}</div>
          <div class="timeslot-remaining">({{ timeslot.remaining_passes }} left)</div>
        </button>
      </div>
    </div>
  </div>
</template>


<script>
import LoginForm from './components/LoginForm.vue'
import app from "./FirebaseService"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import dayjs from "dayjs";
import axios from "axios";
const customParseFormat = require('dayjs/plugin/customParseFormat');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);


const auth = getAuth(app);

export default {
  name: 'App',
  data() {
    return {
      isLoading: true,
      user: null,
      todayDateString: (dayjs()).format('dddd - MM/DD/YYYY'),
      tomorrowDateString: (dayjs()).add(1, 'day').format('dddd - MM/DD/YYYY'),
      todayPassAvailability: [],
      tomorrowPassAvailability: []
    }
  },
  components: {
    LoginForm
  },
  mounted() {
    this.getPassAvailability();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.user = user;
      } else {
        this.user = null;
      }

      this.isLoading = false;
    });
  },
  methods: {
    handleLogout() {
      signOut(auth);
    },
    async getPassAvailability() {
      // ex. https://www.recreation.gov/api/timedentry/availability/facility/10075177?date=2023-05-03
      const baseUrl = 'https://www.recreation.gov/api/timedentry/availability/facility/10075177';
      const today = dayjs();
      const todayDateString = today.format('YYYY-MM-DD');
      const todayUrl = `${baseUrl}?date=${todayDateString}`;
      const tomorrow = dayjs().add(1, 'day');
      const tomorrowDateString = tomorrow.format('YYYY-MM-DD');
      const tomorrowUrl = `${baseUrl}?date=${tomorrowDateString}`;

      const todayPromise = axios.get(todayUrl);
      const tomorrowPromise = axios.get(tomorrowUrl);
      // eslint-disable-next-line
      let responses = [];

      try {
        responses = await Promise.all([todayPromise, tomorrowPromise]);  
      } catch (error) {
        alert('Unable to retrieve red rock pass availability.');
      }
      const nowHour = Number(dayjs.utc().tz('America/Los_Angeles').format('HH'));
      const todayDate = today.format('MM/DD/YYYY');
      this.todayPassAvailability = this.processTimeslots(responses[0].data, nowHour, todayDate);
      const tomorrowHour = 8;
      const tomorrowDate = tomorrow.format('MM/DD/YYYY');
      this.tomorrowPassAvailability = this.processTimeslots(responses[1].data, tomorrowHour, tomorrowDate);
    },
    processTimeslots(rawTimeslots, referenceHour, date) {
      const timeslots = rawTimeslots.reduce((array, rawRimeslot) => {
        const nowHour = referenceHour;
        const timeslotHour = Number(rawRimeslot.tour_time.substring(0, 2));

        // Only display available timeslots
        if(timeslotHour >= nowHour) {
          const start = dayjs.utc(rawRimeslot.tour_start_timestamp).tz('America/Los_Angeles').format('h:mm A');
          const end = dayjs.utc(rawRimeslot.tour_end_timestamp).tz('America/Los_Angeles').format('h:mm A');
          const inventoryCount = rawRimeslot.inventory_count.FIT + rawRimeslot.inventory_count.FIT_SECONDARY;
          const reservedCount = rawRimeslot.reservation_count.FIT + 
            rawRimeslot.reservation_count.FIT_SECONDARY +
            rawRimeslot.reservation_count.WALKUP;
          const availablePassCount = inventoryCount - reservedCount;
  
          const timeslot = {
            date: date,
            title: `${start} - ${end}`,
            tour_time: rawRimeslot.tour_time,
            remaining_passes: availablePassCount
          };
  
          if(availablePassCount > 0) {
            array.push(timeslot);
          }
        }

        return array;
      }, []);

      return timeslots;
    },
    async handleReserveTimeslotClick(timeslot) {
      const isConfirmed = window.confirm(`Confirm ${timeslot.date} at ${timeslot.title}?`);

      if(isConfirmed) {

        try {
          const apiUrl = `${process.env.VUE_APP_API_KEY}`;
          const resposne = await axios.post(apiUrl);

          alert(JSON.stringify(resposne.data));
        } catch (error) {
          alert(error);
        }
      }
    }
  }
}


</script>

<style>
html {
  font-size: 62.5%;
}

body {
  background-color: #f7f7f7;
  font-family: 'Open Sans', sans-serif;
  font-size: 1.6rem;
  line-height: 1.5;
}

.logout-button {
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.logout-button:hover {
  background-color: #555;
}

#app {
  margin: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 1rem;
}

.welcome-message {
  background-color: #fff;
  color: #333;
  padding: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 1rem;
}

.timeslot-table {
  display: flex;
  flex-wrap: wrap;
}

.timeslot-table > div {
  flex: 1;
  min-width: 300px;
  margin-right: 2rem;
  margin-bottom: 2rem;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 1rem;
}

.timeslot-table h3 {
  background-color: #f1f1f1;
  color: #333;
  padding: 1rem;
  margin: 0;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

.timeslot-table h4 {
  background-color: #f1f1f1;
  color: #333;
  padding: 1rem;
  margin: 0;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

.entry-windows {
  display: flex;
  flex-wrap: wrap;
  padding: 2rem;
}

.timeslot-button {
  border: none;
  background-color: #eee;
  color: #333;
  padding: 1rem;
  margin-right: 2rem;
  margin-bottom: 2rem;
  border-radius: 1rem;
  cursor: pointer;
}

.timeslot-button:hover {
  background-color: #87cefa;
}

.entry-windows {
  display: flex;
  flex-direction: column;
}
</style>
