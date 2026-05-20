import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "../types";

export interface InspectorState {
  events: IkiraroEvent[];
}

/**
 * The InspectorPlugin captures all runtime events for development visualization.
 */
export class InspectorPlugin implements IkiraroPlugin<InspectorState> {
  name = "inspector";
  initialState: InspectorState = { events: [] };
  private readonly MAX_EVENTS = 100;

  setup(_ctx: PluginContext<InspectorState>) {
    // No manual subscription needed for state updates, we use the reducer.
  }

  reducer(state: InspectorState, event: IkiraroEvent): InspectorState {
    // Keep a running history of all events
    const newEvents = [event, ...state.events].slice(0, this.MAX_EVENTS);
    return { ...state, events: newEvents };
  }
}
