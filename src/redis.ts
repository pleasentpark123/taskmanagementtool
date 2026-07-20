import {createClient} from "redis";

export const redisClient = createClient();
redisClient.on('error', (e) => console.error('Redis error:', e))
