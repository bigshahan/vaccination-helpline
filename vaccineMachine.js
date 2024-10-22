const { Machine, assign } = require('xstate');

const vaccineMachine = Machine({
    id: 'vaccine',
    initial: 'welcome',
    context: {
      phone: null,
      zipCode: null,
      createdAt: null,
    },
    states: {
      welcome: {
        entry: assign({
          createdAt: () => new Date(),
        }),
        on: {
          PRESS_ONE: 'zipCodeInput',
          PRESS_TWO: 'numberInput',
          PRESS_THREE: 'welcome',
        },
      },
      numberInput: {
        on: {
          PRESS_POUND: {
            target: 'numberInputConfirm',
            actions: assign({
              phone: (context, event) => event.Digits,
              zipCode: (context, event) => event.CallerZip,
            }),
          }
        }
      },
      numberInputConfirm: {
        on: {
          PRESS_ONE: 'zipCodeInput',
          PRESS_TWO: 'numberInput',
          PRESS_THREE: 'numberInputConfirm',
        },
      },
      zipCodeInput: {
        on: {
          PRESS_POUND: {
            target: 'zipCodeInputConfirm',
            actions: assign({
              zipCode: (context, event) => event.Digits
            }),
          },
        },
      },
      zipCodeInputConfirm: {
        on: {
          PRESS_ONE: 'voicemail',
          PRESS_TWO: 'zipCodeInput',
          PRESS_THREE: 'zipCodeInputConfirm',
        },
      },
      voicemail: {
        on: {
          PRESS_POUND: 'hangup',
        }
      },
      hangup: {
        type: 'final',
      }
    }
  });

const existingSessions = {};

const getStateForSession = (sid) => {
  return existingSessions[sid] || vaccineMachine.initialState;
}

const saveStateForSession = (sid, newState) => {
  existingSessions[sid] = newState;
}

const deleteStateForSession = (sid) => {
  delete existingSessions[sid];
}

module.exports = {
  vaccineMachine,
  getStateForSession,
  saveStateForSession,
  deleteStateForSession,
}
