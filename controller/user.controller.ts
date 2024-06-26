import { NextFunction, Request, Response } from 'express'
import { ExtendedRequest } from '../utils/middleware'
import { PrismaClient } from '@prisma/client'
import helper from '../utils/helpers'
const prisma = new PrismaClient()

const get_all_users = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const query = req.query
    const { page = 1, limit = 10 } = query
    if (isNaN(Number(page)) || isNaN(Number(limit))) {
        return res
            .status(200)
            .send({ status: 400, error: 'Bad Request', error_description: 'Invalid Query Parameters' })
    }
    const skip = (Number(page) - 1) * Number(limit)
    try {
        const users = await prisma.user.findMany({
            skip: skip,
            take: Number(limit),
            where: { NOT: { id: req.user.id } },
        })
        return res.status(200).send({ status: 200, message: 'Ok', users: users })
    } catch (err) {
        return next(err)
    }
}

const get_user_feed = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const query = req.query
    const { page = 1, limit = 10 } = query
    if (Number.isNaN(page) || Number.isNaN(limit))
        return res.status(200).send({
            status: 400,
            error: 'Invalid query parameters',
            error_description: 'skip, limit should be a number',
        })

    const skip = (Number(page) - 1) * Number(limit)
    console.log(skip, limit)
    try {
        const userIdsObjArr = await prisma.follows.findMany({
            where: { follower_id: req.user.id },
            select: { user_id: true },
            skip: skip,
            take: Number(limit),
        })
        const userIds = userIdsObjArr.map((user_id) => user_id.user_id)
        const fetchPost = await prisma.post.findMany({
            where: { user_id: { in: userIds } },
        })
        return res.status(200).send({ status: 200, message: 'Ok', posts: fetchPost })
    } catch (err) {
        return next(err)
    }
}

const get_user_details = (req: ExtendedRequest, res: Response, _next: NextFunction) => {
    return res.status(200).send({ status: 200, message: 'Ok', user: req.user })
}

const update_user = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const user = req.user
    let { username, gender, date_of_birth, bio } = req.body
    if (gender) {
        gender = Number(gender)
        if (Number.isNaN(gender)) {
            return res.status(200).send({
                status: 200,
                error: 'Invalid Payload',
                error_description: "Gender type isn't correct. It should be a number",
            })
        }
    }
    if (!helper.isValidDateFormat(date_of_birth)) {
        return res.status(200).send({ status: 400, error: 'Bad Request', error_description: 'Invalid Date Format' })
    }

    date_of_birth = new Date(date_of_birth)

    let imagePath: string | undefined
    if (req.file) {
        imagePath = req.file.filename
    }
    try {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { username, gender, date_of_birth, bio, image: imagePath },
        })
        delete (updatedUser as any).password
        return res.status(200).send({ status: 200, message: 'Ok', user: updatedUser })
    } catch (err) {
        return next(err)
    }
}
const Get_follower = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const user = req.user
    const query = req.query
    const { iscount } = query
    if (iscount) {
        const followerCount = await prisma.follows.count({ where: { user_id: user.id } })
        return res.status(200).send({ status: 200, message: 'Ok', followerCount: followerCount })
    } else {
        try {
            const followers = await prisma.follows.findMany({
                where: {
                    user_id: user.id,
                },
            })
            return res.status(200).send({ status: 200, message: 'Ok', followers: followers })
        } catch (err) {
            return next(err)
        }
    }
}

const GET_following = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const user = req.user
    const query = req.query
    const { iscount } = query
    if (iscount) {
        try {
            const followingCount = await prisma.follows.count({ where: { follower_id: user.id } })
            return res.status(200).send({ status: 200, message: 'Ok', followingCount: followingCount })
        } catch (err) {
            return next(err)
        }
    } else {
        try {
            const following = await prisma.follows.findMany({ where: { follower_id: user.id } })
            return res.status(200).send({ status: 200, message: 'Ok', following: following })
        } catch (err) {
            return next(err)
        }
    }
}
const userController = { get_all_users, get_user_feed, get_user_details, update_user, Get_follower, GET_following }

export default userController
