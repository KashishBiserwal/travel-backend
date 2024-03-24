// eslint-disable-next-line @typescript-eslint/ban-ts-comment@ts-nocheck
import { Router } from 'express'
import userController from '../controller/user.controller'
import { upload } from '../index'
const userRouter = Router()

userRouter
    //@ts-ignore
    .get('/', userController.get_user_details)
    //@ts-ignore
    .put('/', upload.single('profile_pic'), userController.update_user)

export default userRouter
