import React from "react";
import { CardTitle } from "./card";
import { LogoutButton } from "./button";
import '../style/unified.css';

export default function FCRHeader(props: { token: string | null, onClick: () => void }) {
    return (
        <header className="fcr-header" style={{ display: "flex", justifyContent: "flex-end", minHeight: "48px" }}>
            {props.token ? (
                <LogoutButton onClick={props.onClick} />
            ) : (
                <div style={{ height: "32px" }} />
            )}
        </header>
    );
}