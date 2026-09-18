from enum import StrEnum


class OrchestratorAction(StrEnum):
    DELEGATE = "delegate"
    WAIT_USER = "wait_user"
    RESUME = "resume"
    COMPLETE = "complete"
    RETRY = "retry"
    FAIL = "fail"
