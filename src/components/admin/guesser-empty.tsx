import type { ReactNode } from "react";
import { FileQuestion } from "lucide-react";
import { useTranslate, useResourceContext, useResourceDefinition } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";

export const GuesserEmpty = ({
  title = "ra.guesser.empty.title",
  message = "ra.guesser.empty.message",
}: GuesserEmptyProps) => {
  const translate = useTranslate();
  const resource = useResourceContext();
  const { hasCreate } = useResourceDefinition({ resource });

  const resolvedTitle =
    typeof title === "string" ? translate(title, { _: title }) : title;
  const resolvedMessage =
    typeof message === "string" ? translate(message, { _: message }) : message;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-2xl font-semibold">{resolvedTitle}</h2>
      <p className="text-muted-foreground">{resolvedMessage}</p>
      {hasCreate && (
        <div className="mt-4">
          <CreateButton />
        </div>
      )}
    </div>
  );
};

export interface GuesserEmptyProps {
  title?: ReactNode;
  message?: ReactNode;
}
