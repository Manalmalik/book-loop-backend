import { Router, type Request } from "express";
import prisma from "../lib/prisma";
import { isAuthenticated } from "../middleware/jwt.middleware";

const router = Router();

router.get("/challenges", isAuthenticated, async (req, res, next) => {
	try {
		const payload = (
			req as Request & {
				payload?: { id: number; email: string; name: string };
			}
		).payload;

		if (!payload) {
			return res.status(401).json({ errorMessage: "Authentication required" });
		}

		const challenges = await prisma.challenge.findMany({
			where: {
				OR: [
					{ challengerId: payload.id },
					{ challengedUserId: payload.id },
				],
			},
			include: {
				challenger: { select: { id: true, name: true } },
				challengedUser: { select: { id: true, name: true } },
				book: { select: { id: true, title: true, author: true, coverUrl: true } },
			},
			orderBy: { createdAt: "desc" },
		});

		return res.status(200).json({ challenges });
	} catch (error) {
		next(error);
	}
});

router.patch("/challenges/:challengeId", isAuthenticated, async (req, res, next) => {
	try {
		const payload = (
			req as Request & {
				payload?: { id: number; email: string; name: string };
			}
		).payload;

		if (!payload) {
			return res.status(401).json({ errorMessage: "Authentication required" });
		}

		const challengeId = Number(req.params.challengeId);
		if (!Number.isInteger(challengeId) || challengeId <= 0) {
			return res.status(400).json({ errorMessage: "A valid challenge ID is required" });
		}

		const { status } = req.body ?? {};
		if (status !== "ACCEPTED" && status !== "DECLINED") {
			return res.status(400).json({ errorMessage: "Status must be ACCEPTED or DECLINED" });
		}

		const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
		if (!challenge) {
			return res.status(404).json({ errorMessage: "Challenge not found" });
		}

		if (challenge.challengedUserId !== payload.id) {
			return res.status(403).json({ errorMessage: "Only the challenged reader can respond" });
		}

		if (challenge.status !== "PENDING") {
			return res.status(409).json({ errorMessage: "This challenge has already been answered" });
		}

		const updatedChallenge = await prisma.challenge.update({
			where: { id: challengeId },
			data: { status },
			include: {
				challenger: { select: { id: true, name: true } },
				challengedUser: { select: { id: true, name: true } },
				book: { select: { id: true, title: true, author: true, coverUrl: true } },
			},
		});

		return res.status(200).json(updatedChallenge);
	} catch (error) {
		next(error);
	}
});

router.post("/challenges", isAuthenticated, async (req, res, next) => {
	try {
		const payload = (
			req as Request & {
				payload?: { id: number; email: string; name: string };
			}
		).payload;

		if (!payload) {
			return res.status(401).json({ errorMessage: "Authentication required" });
		}

		if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
			return res.status(400).json({ errorMessage: "Request body must be an object" });
		}

		const { challengedUserId, bookId, title, message, deadline } = req.body;

		if (!Number.isInteger(challengedUserId) || challengedUserId <= 0) {
			return res.status(400).json({ errorMessage: "A valid challengedUserId is required" });
		}

		if (!Number.isInteger(bookId) || bookId <= 0) {
			return res.status(400).json({ errorMessage: "A valid bookId is required" });
		}

		if (challengedUserId === payload.id) {
			return res.status(400).json({ errorMessage: "You cannot challenge yourself" });
		}

		if (title !== undefined && title !== null && typeof title !== "string") {
			return res.status(400).json({ errorMessage: "title must be a string or null" });
		}

		if (message !== undefined && message !== null && typeof message !== "string") {
			return res.status(400).json({ errorMessage: "message must be a string or null" });
		}

		let parsedDeadline: Date | null | undefined;
		if (deadline !== undefined) {
			if (deadline === null) {
				parsedDeadline = null;
			} else if (typeof deadline !== "string" || Number.isNaN(Date.parse(deadline))) {
				return res.status(400).json({ errorMessage: "deadline must be a valid date string or null" });
			} else {
				parsedDeadline = new Date(deadline);
			}
		}

		const [challengedUser, book] = await Promise.all([
			prisma.user.findUnique({ where: { id: challengedUserId }, select: { id: true } }),
			prisma.book.findUnique({ where: { id: bookId }, select: { id: true } }),
		]);

		if (!challengedUser) {
			return res.status(404).json({ errorMessage: "Challenged user not found" });
		}

		if (!book) {
			return res.status(404).json({ errorMessage: "Book not found" });
		}

		const challenge = await prisma.challenge.create({
			data: {
				title: title ?? null,
				message: message ?? null,
				...(parsedDeadline !== undefined ? { deadline: parsedDeadline } : {}),
				challengerId: payload.id,
				challengedUserId,
				bookId,
			},
			include: {
				challenger: { select: { id: true, name: true, email: true } },
				challengedUser: { select: { id: true, name: true, email: true } },
				book: true,
			},
		});

		return res.status(201).json(challenge);
	} catch (error) {
		next(error);
	}
});

export default router;
