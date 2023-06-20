export function setCoEvents(state, action) {
  switch (action.type) {
    case 'SET_PARENT_ORIGIN':
      return { ...state, coEvents: { ...state.coEvents, origin: action.payload } };
    case 'SET_PARENT_EVENT':
      const events = [...state.coEvents.events, action.payload];
      return { ...state, coEvents: { ...state.coEvents, events } };
    default:
      return state;
  }
}
