import React from "react";
import { CardTitle } from "./card";
import { LogoutButton } from "./button";
import "../style/header.css";

export default function FCRHeader(props: { token: string | null, onClick: () => void }) {
    return <header className="fcr-header">
        <CardTitle className="fcr-title">Voting Application</CardTitle>
        {props.token && (
            <LogoutButton onClick={props.onClick} />
        )}
    </header>;
}