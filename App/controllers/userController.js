const mongoose = require('mongoose');
const shortId = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const validateInput = require('./../libs/paramsValidationLib');
const passwordLib = require('./../libs/generatePasswordLib')
const check = require('./../libs/checkLib');
const token = require('./../libs/tokenLib')

const UserModel = mongoose.model('User')
const AuthModel = mongoose.model('Auth')
const SocialModel = mongoose.model('SocialUser')


let getAllUser = async (req, res) => {
   const result = await UserModel.find() .select(' -password -__v -_id').lean().exec() 
            
        try{
            if (check.isEmpty(result)) {
                logger.captureInfo('No User Found', 'User Controller: getAllUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                
                let apiResponse = response.generate(false, 'All User Details Found', 200, result)
                res.send(apiResponse)
            }
        } catch(err) {
                logger.captureError(err.message, 'User Controller: getAllUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
        }
        
}// end get all users

let getSocialUser = async(req, res)=>{
    const result = await SocialModel.find().select('-__v -_id').lean().exec()
        if(check.isEmpty(result)){
            logger.captureInfo('No User Found', 'User Controller: getAllUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse) 
        }else{
            let apiResponse = response.generate(false, 'All User Details Found', 200, result)
            res.send(apiResponse)
        }
}

/* Get single user details */
let getSingleUser = async (req, res) => {
   const result = await UserModel.findOne({ 'userId': req.params.userId }).select('-password -__v -_id').lean().exec();
        try{
            if (check.isEmpty(result)) {
                logger.captureInfo('No User Found', 'User Controller:getSingleUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'User Details Found', 200, result)
                res.send(apiResponse)
            }
        } catch(err){
            console.log(err)
                logger.captureError(err.message, 'User Controller: getSingleUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
        }
}// end get single user

let deleteUser = async (req, res) => {

   const result = await UserModel.findOneAndDelete({ 'userId': req.params.userId }).exec()
    
    try{
        if (check.isEmpty(result)) {
            logger.captureInfo('No User Found', 'User Controller: deleteUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Deleted the user successfully', 200, result)
            res.send(apiResponse)
        }
    } catch(err){
        console.log(err)
            logger.captureError(err.message, 'User Controller: deleteUser', 10)
            let apiResponse = response.generate(true, 'Failed To delete user', 500, null)
            res.send(apiResponse)
    }


}// end delete user

let editUser = async (req, res) => {

    let options = req.body;
    const result = await UserModel.update({ 'userId': req.params.userId }, options).exec()
     try{
        if (check.isEmpty(result)) {
            logger.captureInfo('No User Found', 'User Controller: editUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'User details edited', 200, result)
            res.send(apiResponse)
        }
    } catch(err){
        console.log(err)
            logger.captureError(err.message, 'User Controller:editUser', 10)
            let apiResponse = response.generate(true, 'Failed To edit user details', 500, null)
            res.send(apiResponse)
    }


}// end edit user





// start user signup function 






let signUpFunction = async (req, res) => {
    await new Promise(async (resolve) => {
        if (req.body.email) {
            if (!validateInput.Email(req.body.email)) {
                let apiResponse = response.generate(true, 'Email Does not meet the requirement', 400, null)
                res.send(apiResponse)
            } else if (check.isEmpty(req.body.password)) {
                let apiResponse = response.generate(true, '"password" parameter is missing"', 400, null)
                res.send(apiResponse)
            } else {
                resolve(req)
            }
        } else {
            logger.captureError('Field Missing During User Creation', 'userController: createUser()', 5)
            let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
            res.send(apiResponse)
        }
    })
    await new Promise(async () => {
        let retrievedUserDetails = await UserModel.findOne({ email: req.body.email }).exec()
        try {
            if (check.isEmpty(retrievedUserDetails)) {
                console.log(req.body)
                let newUser = new UserModel({
                    userId: shortId.generate(),
                    firstName: req.body.firstName,
                    lastName: req.body.lastName || '',
                    email: req.body.email.toLowerCase(),
                    mobileNumber: req.body.mobileNumber,
                    password: passwordLib.hashpassword(req.body.password),
                    createdOn: time.now()
                })
                newUser.save((err, newUser) => {
                    if (err) {
                        console.log(err)
                        logger.captureError(err.message, 'userController: createUser', 10)
                        let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                        res.send(apiResponse)
                    } else {
                        let newUserObj = newUser.toObject();
                        delete newUserObj.password
                        let apiResponse = response.generate(false, 'User created', 200, newUserObj)
                        res.send(apiResponse)
                    }
                })
            } else {
                logger.captureError('User Cannot Be Created.User Already Present', 'userController: createUser', 4)
                let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null)
                res.send(apiResponse)
            }
        } catch (err) {
            logger.captureError(err.message, 'userController: createUser', 10)
            let apiResponse = response.generate(true, 'Failed To Create User', 500, null)
            res.send(apiResponse)
        }
    })

}// end user signup function 

// start of login function 
let loginFunction = (req, res) => {
    let findUser = () => {
        console.log("findUser");
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                console.log("req body email is there");
                console.log(req.body);
                UserModel.findOne({ email: req.body.email}, (err, userDetails) => {
                    /* handle the error here if the User is not found */
                    if (err) {
                        console.log(err)
                        logger.captureError('Failed To Retrieve User Data', 'userController: findUser()', 10)
                        /* generate the error message and the api response message here */
                        let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                        reject(apiResponse)
                        /* if Company Details is not found */
                    } else if (check.isEmpty(userDetails)) {
                        /* generate the response and the console error message here */
                        logger.captureError('No User Found', 'userController: findUser()', 7)
                        let apiResponse = response.generate(true, 'No User Details Found', 404, null)
                        reject(apiResponse)
                    } else {
                        /* prepare the message and the api response here */
                        logger.captureInfo('User Found', 'userController: findUser()', 10)
                        resolve(userDetails)
                    }
                });
               
            } else {
                let apiResponse = response.generate(true, '"email" parameter is missing', 400, null)
                reject(apiResponse)
            }
        })
    }
    let validatePassword = (retrievedUserDetails) => {
        console.log("validatePassword...");
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrievedUserDetails.password, (err, isMatch) => {
                if (err) {
                    console.log(err)
                    logger.captureError(err.message, 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Login Failed', 500, null)
                    reject(apiResponse)
                } else if (isMatch) {
                    let retrievedUserDetailsObj = retrievedUserDetails.toObject()
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj._id
                    delete retrievedUserDetailsObj.__v
                    delete retrievedUserDetailsObj.createdOn
                    delete retrievedUserDetailsObj.modifiedOn
                    resolve(retrievedUserDetailsObj)
                } else {
                    logger.captureInfo('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Wrong Password.Login Failed', 400, null)
                    reject(apiResponse)
                }
            })
        })
    }

    let generateToken = (userDetails) => {
        console.log("generate token");
        return new Promise((resolve, reject) => {
            token.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }
            })
        })
    }
    let saveToken = (tokenDetails) => {
        console.log("save token");
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }, (err, retrievedTokenDetails) => {
                if (err) {
                    console.log(err.message, 'userController: saveToken', 10)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else if (check.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    })
                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.captureError(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                } else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.captureError(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
            })
        })
    }

    findUser(req,res)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("errorhandler");
            console.log(err);
            res.status(err.status)
            res.send(err)
        })
}

let logout = async (req, res) => {
  let userDetails = await  UserModel.findOne({userId: req.body.userId})
  try{
    if(check.isEmpty(userDetails)){
        logger.captureInfo('No User Found', 'User Controller:logout')
        let apiResponse = response.generate(true, 'No User Found', 404, null)
        res.send(apiResponse)
    } else {
        await AuthModel.findOneAndDelete({userId: req.body.userId})
        let apiResponse = response.generate(false, 'Logged out successfully', 200, null)
        res.send(apiResponse)
    }
} catch(err){
    logger.captureError(err.message, 'User Controller: logout', 10)
    let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
     res.send(apiResponse)
}


} // end of the logout function.


module.exports = {

    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout,
    getAllUser : getAllUser,
    deleteUser : deleteUser,
    getSingleUser : getSingleUser,
    getSocialUser: getSocialUser,
    editUser : editUser

}// end exports
