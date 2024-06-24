import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt';
import { createBlogInput, updateBlogInput } from '@harjot02/medium-common';


export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    },
    Variables : {
        userId : string;
    }
}>();

blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("authorization") || ""
    try{
        const user = await verify(authHeader, c.env.JWT_SECRET)
        if (user){
            const id = String(user.id) 
            c.set("userId", id)
            await next();
        }else{
            c.status(403)
            return c.json({
                message : "You are not logged in"
            })
        }
    }catch(e){
        c.status(403)
        c.json({
            message : "Authentication Error"
        })
    }
})

blogRouter.post('/', async (c) => {
    const body = await c.req.json()
    const { success } = createBlogInput.safeParse(body)
    if (!success) {
      c.status(411)
      return c.json({
        message : "Wrong Inputs"
      })
    }
    const userId = c.get("userId")
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.create({
        data: {
            title : body.title,
            content : body.content,
            authorId : Number(userId)
        }
    })
    return c.json({
        id : blog.id
    })
})

blogRouter.put('/', async (c) => {
    const body = await c.req.json()
    const { success } = updateBlogInput.safeParse(body)
    if (!success) {
      c.status(411)
      return c.json({
        message : "Wrong Inputs"
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.update({
        where : {
            id : body.id
        },
        data: {
            title : body.title,
            content : body.content,
        }
    })
    return c.json({
        id : blog.id
    })
})

blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
        const blogs = await prisma.blog.findMany()
        return c.json({
            blogs
        })
    } catch(e){
        c.status(411)
        return c.json({
            message : "Error while fetching blog post"
        })
    }
})

blogRouter.get('/:id', async (c) => {
    const id = await c.req.param("id")
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
        const blog = await prisma.blog.findFirst({
            where : {
                id : Number(id)
            }
        })
        return c.json({
            blog
        })
    } catch(e){
        c.status(411)
        return c.json({
            message : "Error while fetching blog post"
        })
    }
})
