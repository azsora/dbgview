import mitt from 'mitt';
import type { TabEvent } from './types/tab';

export type { TabEvent } from './types/tab';

export const eventBus = mitt<TabEvent>();
