// Lifecycle State Machine
const VALID_TRANSITIONS = {
    draft: ['finalized', 'cancelled'],
    finalized: ['sent', 'partially_paid', 'paid', 'cancelled', 'archived'],
    sent: ['partially_paid', 'paid', 'overdue', 'cancelled', 'archived'],
    partially_paid: ['paid', 'overdue', 'archived'],
    paid: ['archived'],
    overdue: ['partially_paid', 'paid', 'cancelled', 'archived'],
    cancelled: ['archived'],
    archived: [],
};
export function isValidStatusTransition(from, to) {
    if (from === to)
        return true;
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
