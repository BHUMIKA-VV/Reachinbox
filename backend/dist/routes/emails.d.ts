declare global {
    namespace Express {
        interface Request {
            file?: Express.Multer.File;
        }
    }
}
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=emails.d.ts.map