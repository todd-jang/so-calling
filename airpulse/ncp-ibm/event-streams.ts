/**
 * Kafka Event Stream Bridge (Airpulse)
 */

import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'airpulse-bridge',
  brokers: [process.env.IBM_KAFKA_BROKER || '']
});

const producer = kafka.producer();

export async function publishToIBM(event: string, data: any) {
  await producer.connect();
  await producer.send({
    topic: 'airpulse-sync-events',
    messages: [
      { 
        key: event, 
        value: JSON.stringify({
          source: 'AIRPULSE_NKS',
          timestamp: new Date().toISOString(),
          payload: data
        }) 
      }
    ]
  });
}

const consumer = kafka.consumer({ groupId: 'airpulse-bridge-group' });

export async function startEventBridge() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'ibm-control-events', fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }: { message: any }) => {
      console.log(`[Airpulse Bridge] Received from IBM: ${message.value?.toString()}`);
    }
  });
}
