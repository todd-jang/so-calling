/**
 * Kafka Event Stream Bridge
 * Connects NCP events to IBM Event Streams
 */

import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'archscript-bridge',
  brokers: [process.env.IBM_KAFKA_BROKER || '']
});

const producer = kafka.producer();

export async function publishToIBM(event: string, data: any) {
  await producer.connect();
  await producer.send({
    topic: 'ncp-sync-events',
    messages: [
      { 
        key: event, 
        value: JSON.stringify({
          source: 'NCP_NKS',
          timestamp: new Date().toISOString(),
          payload: data
        }) 
      }
    ]
  });
}

const consumer = kafka.consumer({ groupId: 'ncp-bridge-group' });

export async function startEventBridge() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'ibm-control-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log(`[Bridge] Received event from IBM: ${message.value?.toString()}`);
      // Trigger NCP action based on IBM event
    }
  });
}
