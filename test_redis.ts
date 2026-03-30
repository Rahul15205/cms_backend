import { redisStore } from 'cache-manager-redis-yet';

async function test() {
  try {
    const store = await redisStore({
      socket: {
        host: 'localhost',
        port: 6379
      }
    });
    console.log("Store Created!", !!store);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
