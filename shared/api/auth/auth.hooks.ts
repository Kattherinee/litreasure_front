"use client";

import { useMutation } from "@tanstack/react-query";

import { login, register } from "./auth.api";

export const useRegisterMutation = () => useMutation({ mutationFn: register });

export const useLoginMutation = () => useMutation({ mutationFn: login });
