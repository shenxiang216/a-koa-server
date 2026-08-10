import axios from 'axios'

const baseURL = 'http://127.0.0.1:4014'
const cookie = 'session_id=a64aac84f6a49c5e2494d379'

const request = axios.create({
  baseURL,
  headers: {
    Cookie:cookie,
  },
})

export { request }
