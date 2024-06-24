import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signinInput, signupInput } from '@harjot02/medium-common';


export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    }
}>();

userRouter.post('/signup', async (c) => {
    const body = await c.req.json()
    const { success } = signupInput.safeParse(body)
    if (!success) {
      c.status(411)
      return c.json({
        message : "Wrong Inputs"
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try{
      const user = await prisma.user.create({
        data: {
          username: body.username,
          password: body.password,
          name: body.name
        }
      })
      const jwt = await sign({
        id: user.id
      },c.env.JWT_SECRET)
       
      return c.text(jwt)
    } catch(e){
      c.status(411);
      return c.text('User with this email id already exists')
    }
})
  
userRouter.post('/signin', async (c) => {
    const body = await c.req.json()
    const { success } = signinInput.safeParse(body)
    if (!success) {
      c.status(411)
      return c.json({
        message : "Wrong Inputs"
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try{
      const user = await prisma.user.findFirst({
        where: {
          username: body.username,
          password: body.password,
          name: body.name
        }
      })
      if (!user) {
        c.status(403)
        return c.text('Incorrect credentials')
      }
  
      const jwt = await sign({
        id: user.id
      },c.env.JWT_SECRET)
       
      return c.text(jwt)
    } catch(e){
      c.status(411);
      return c.text('User with this email id already exists')
    }
})