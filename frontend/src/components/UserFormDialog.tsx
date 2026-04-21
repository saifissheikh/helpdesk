import { useEffect } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createUserSchema,
  updateUserSchema,
  type UpdateUserInput,
} from "@helpdesk/core/schemas/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type EditableUser = {
  id: string;
  name: string;
  email: string;
};

export type UserFormMode =
  | { mode: "create" }
  | { mode: "edit"; user: EditableUser };

type UserFormDialogProps = {
  state: UserFormMode | null;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_VALUES: UpdateUserInput = { name: "", email: "", password: "" };

export function UserFormDialog({ state, onOpenChange }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = state?.mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (state?.mode === "create") {
      reset(EMPTY_VALUES);
    } else if (state?.mode === "edit") {
      reset({ name: state.user.name, email: state.user.email, password: "" });
    }
  }, [state, reset]);

  const submitUser = useMutation({
    mutationFn: async (values: UpdateUserInput) => {
      if (!state) return;
      if (state.mode === "create") {
        await axios.post("/api/users", values);
      } else {
        await axios.patch(`/api/users/${state.user.id}`, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error ??
          err.message
        : "Failed to save user";
      setError("root", { message });
    },
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset(EMPTY_VALUES);
  };

  return (
    <Dialog open={state !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this user's details. Leave the password blank to keep their current password."
              : "Add a new agent to the helpdesk. They can sign in with the password you set here."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => submitUser.mutate(values))}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              placeholder={
                isEdit ? "Leave blank to keep current password" : undefined
              }
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitUser.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitUser.isPending}>
              {submitUser.isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
