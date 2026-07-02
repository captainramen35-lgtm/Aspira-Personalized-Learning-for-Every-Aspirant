# TODO: Implement 60/40 weak/strong topic weighting logic for personalized paper generation


def generate_weighted_paper(mastery_profile: dict, question_bank: list) -> list:
    """
    Generate a personalized question paper using a weighted selection strategy.

    Args:
        mastery_profile: A dict mapping topic names to mastery scores (0-100).
        question_bank: A list of question dicts from the question bank.

    Returns:
        A list of selected question dicts for the personalized paper.
    """
    # TODO: Implement the 60/40 weighting rule:
    #   - 60% of questions should come from topics where the student is WEAK (mastery < threshold, e.g. < 60)
    #   - 40% of questions should come from topics where the student is STRONG (mastery >= threshold)
    #   - Sort topics by mastery score to identify weak vs strong
    #   - Randomly sample from the question bank filtered by topic
    #   - Return the final list of selected questions

    return []
