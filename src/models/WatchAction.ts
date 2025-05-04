import Model from './WatchAction.schema';

export const watchStatuses = ['watching', 'completed', 'dropped', 'pending'] as const;
export type WatchStatus = (typeof watchStatuses)[number];

export default class WatchAction extends Model {}
