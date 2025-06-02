def get_title_or_message(current_stage, current_user, is_tie, votes_remaining, winner):
    # Generate title and waiting message based on stage, votes remaining, and tie status
    title = ""
    waiting_message = ""
    # If we have a winner, set appropriate title and clear waiting message
    if winner:
        title = "Voting Completed!"
        waiting_message = ""
    elif current_stage == 1:
        if votes_remaining == 3:
            title = f"Round {current_stage}. Choose the 1st Winner (3 points) 🏆"
        elif votes_remaining == 2:
            title = f"Round {current_stage}. Choose the 2nd Winner (2 points) 🥈"
        elif votes_remaining == 1:
            title = f"Round {current_stage}. Choose the 3rd Winner (1 point) 🥉"
        elif votes_remaining == 0:
            title = f"Round {current_stage}. Voting Completed!"
            waiting_message = "Waiting for other users to finish voting..."
    elif current_stage == 2:
        if votes_remaining == 1:
            title = f"Round {current_stage}. Choose the Winner (1 point) 🏆"
        elif votes_remaining == 0:
            title = f"Round {current_stage}. Voting Completed!"
            waiting_message = "Waiting for other users to finish voting..."
    elif current_stage == 3:
        if is_tie:
            if current_user.is_president:
                if votes_remaining == 1:
                    title = f"Round {current_stage}. President Tie-Breaker (1 point)."
                elif votes_remaining == 0:
                    title = f"Round {current_stage}. Voting Completed!"
                    waiting_message = "Waiting for results to be processed..."
            else:
                title = f"Round {current_stage}. Waiting for President to break the tie."
                waiting_message = "The president will cast the deciding vote."
        else:
            title = f"Round {current_stage}. Calculating final results..."
            waiting_message = "The final results are being calculated."
    return title, waiting_message
