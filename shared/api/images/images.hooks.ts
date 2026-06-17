"use client";

import { useMutation } from "@tanstack/react-query";

import { uploadImage } from "./images.api";

export const useUploadImageMutation = () =>
	useMutation({
		mutationFn: uploadImage,
	});
