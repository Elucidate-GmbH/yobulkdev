export function setEfiData(state, action) {
  switch (action.type) {
    case 'SET_EFI_DATA':
      return {
        ...state,
        efiData: {
          origin: action.payload.origin,
          documentKey: action.payload.documentKey,
          isMobile: action.payload.isMobile
        }
      };
    case 'SET_TASK_ID':
      return { ...state, taskId: action.payload }
    default:
      return state;
  }
}
