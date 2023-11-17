import express from 'express';
import cors from 'cors';
import axios from 'axios';

const URL = 'https://api.open-meteo.com/v1/forecast';
export const app = express();

app.use(cors({ origin: true }));

app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

const lats = {
  'petrolina': {
    cidade: 'Petrolina - PE',
    latitude: -9.39416,
    longitude: -40.5096,
  },
  'juazeiro': {
    cidade: 'Juazeiro - BA',
    latitude: -9.43847,
    longitude: -40.5052,
  },
  'casa_nova': {
    cidade: 'Casa Nova - BA',
    latitude: -9.40798,
    longitude: -41.158
  },
  'sao_paulo': {
    cidade: 'São Paulo - SP',
    latitude: -23.5489,
    longitude: -46.6388
  },
}

const toDate = (date) => {
  const [year, month, day] = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  return  `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}

const getInfo = (data) => {
 return data.hourly.time.map((time, index) => {

  return {
    data:toDate(new Date(time)),
    temperatura: data.hourly.temperature_2m[index]
  }}).filter((obj, index, self) =>
  index === self.findIndex((t) => (
    t.data === obj.data
  ))
);
}

app.get('/', async (req, res) => {
  const city = lats[req.query.cidade as string ?? 'petrolina'] ?? lats['petrolina'];

  const params = {
    ...city,
    current: 'temperature_2m,wind_speed_10m',
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
  }

  const data = (await axios.get(URL, { params })).data


  const formattedData = {
    ...city,
    elevacao: data.elevation,
    atual: {
      data: toDate(new Date()),
      temperatura: data.current.temperature_2m,
      elevacao: data.elevation,
      vento: data.current.wind_speed_10m,
    },
    proximos: getInfo(data)
  }

  res.status(200).send(formattedData);
});

const api = express.Router();

api.get('/hello', (req, res) => {
  res.status(200).send({ message: 'hello world' });
});

// Version the api
app.use('/api/v1', api);
