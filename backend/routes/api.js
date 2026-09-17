const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');
const oracledb = require("oracledb");
const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(
      token.split(' ')[1],
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token is not valid' });
  }
};

router.post('/register', async (req, res) => {
  let connection;

  try {
    const {
      FirstName,
      LastName,
      Email,
      Password,
      DOB,
      Gender
    } = req.body;

    connection = await getConnection();

    const existing = await connection.execute(
      `SELECT UserID FROM USERS WHERE Email = :Email`,
      { Email }
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const result = await connection.execute(
      `INSERT INTO USERS
       (FirstName, LastName, Email, DOB, Gender, Password)
       VALUES
       (:FirstName, :LastName, :Email, :DOB, :Gender, :Password)
       RETURNING UserID INTO :UserID`,
      {
        FirstName,
        LastName,
        Email,
        DOB: DOB ? new Date(DOB) : null,
        Gender,
        Password: hashedPassword,
        UserID: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
      },
      { autoCommit: true }
    );

    const userId = result.outBinds.UserID[0];

    const token = jwt.sign(
      { UserID: userId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        _id: userId,
        FirstName,
        LastName,
        Email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

router.post('/login', async (req, res) => {
  let connection;

  try {
    const { Email, Password } = req.body;

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT UserID, FirstName, LastName, Email, Password
       FROM USERS
       WHERE Email = :Email`,
      { Email }
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      Password,
      user.PASSWORD
    );

    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { UserID: user.USERID },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        _id: user.USERID,
        FirstName: user.FIRSTNAME,
        LastName: user.LASTNAME,
        Email: user.EMAIL
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

router.get('/dashboard', auth, async (req, res) => {
  let connection;

  try {
    const userId = req.user.UserID;

    connection = await getConnection();

    const userResult = await connection.execute(
      `SELECT UserID, FirstName, LastName, Email, DOB, Gender
       FROM USERS
       WHERE UserID = :userId`,
      { userId }
    );

    const athleteResult = await connection.execute(
      `SELECT UserID, SportType, SkillLevel
       FROM ATHLETE
       WHERE UserID = :userId`,
      { userId }
    );

    const phonesResult = await connection.execute(
      `SELECT UserID, PhoneNumber
       FROM USER_PHONE
       WHERE UserID = :userId`,
      { userId }
    );

    const activitiesResult = await connection.execute(
      `SELECT ActivityID, Type, Duration, Distance, "Date", UserID
       FROM ACTIVITY
       WHERE UserID = :userId
       ORDER BY "Date" DESC`,
      { userId }
    );

    const nutritionResult = await connection.execute(
      `SELECT NutritionID, MealType, Calories, Quantity, "Date", UserID
       FROM NUTRITION
       WHERE UserID = :userId
       ORDER BY "Date" DESC`,
      { userId }
    );

    const goalsResult = await connection.execute(
      `SELECT GoalID, GoalType, TargetValue, Deadline, UserID
       FROM GOAL
       WHERE UserID = :userId`,
      { userId }
    );

    const wearablesResult = await connection.execute(
      `SELECT DeviceID, Brand, Model, SerialNumber, UserID
       FROM WEARABLE_DEVICE
       WHERE UserID = :userId`,
      { userId }
    );

    const healthMetricsResult = await connection.execute(
      `SELECT hm.DeviceID,
              hm.MetricID,
              hm.MetricType,
              hm.Value,
              hm.Unit,
              hm.Timestamp
       FROM HEALTH_METRIC hm
       JOIN WEARABLE_DEVICE wd
         ON hm.DeviceID = wd.DeviceID
       WHERE wd.UserID = :userId
       ORDER BY hm.Timestamp DESC`,
      { userId }
    );

    const followersResult = await connection.execute(
      `SELECT COUNT(*) AS COUNT
       FROM USER_FOLLOWS
       WHERE FolloweeID = :userId`,
      { userId }
    );

    const followingResult = await connection.execute(
      `SELECT COUNT(*) AS COUNT
       FROM USER_FOLLOWS
       WHERE FollowerID = :userId`,
      { userId }
    );

    const notificationsResult = await connection.execute(
      `SELECT RecipientID,
              SourceType,
              UserID,
              TrainerUserID,
              ContactChannel,
              NotificationPref
       FROM NOTIFICATION_RECIPIENT
       WHERE UserID = :userId`,
      { userId }
    );

    const earnsResult = await connection.execute(
      `SELECT e.ActivityID,
              e.AchievementID,
              a.Title,
              a.Description,
              a.DateAwarded
       FROM EARNS e
       JOIN ACHIEVEMENT a
         ON e.AchievementID = a.AchievementID
       JOIN ACTIVITY act
         ON e.ActivityID = act.ActivityID
       WHERE act.UserID = :userId`,
      { userId }
    );

    const smartwatchResult = await connection.execute(
      `SELECT s.DeviceID,
              s.HasGPS,
              s.WaterResistance
       FROM SMARTWATCH s
       JOIN WEARABLE_DEVICE w
         ON s.DeviceID = w.DeviceID
       WHERE w.UserID = :userId`,
      { userId }
    );

    const fitnessBandResult = await connection.execute(
      `SELECT f.DeviceID,
              f.BandMaterial,
              f.HasHRSensor
       FROM FITNESS_BAND f
       JOIN WEARABLE_DEVICE w
         ON f.DeviceID = w.DeviceID
       WHERE w.UserID = :userId`,
      { userId }
    );

    const wearables = wearablesResult.rows.map(w => {
      const smartwatch = smartwatchResult.rows.find(
        s => s.DEVICEID === w.DEVICEID
      );

      const fitnessBand = fitnessBandResult.rows.find(
        f => f.DEVICEID === w.DEVICEID
      );

      return {
        DeviceID: w.DEVICEID,
        Brand: w.BRAND,
        Model: w.MODEL,
        SerialNumber: w.SERIALNUMBER,
        UserID: w.USERID,
        type: smartwatch
          ? 'Smartwatch'
          : fitnessBand
            ? 'FitnessBand'
            : 'Unknown',
        details: smartwatch || fitnessBand || null
      };
    });

    res.json({
      user: userResult.rows[0] || null,
      athlete: athleteResult.rows[0] || null,
      phones: phonesResult.rows,
      activities: activitiesResult.rows,
      nutrition: nutritionResult.rows,
      goals: goalsResult.rows,
      wearables,
      healthMetrics: healthMetricsResult.rows,
      followers: followersResult.rows[0].COUNT,
      following: followingResult.rows[0].COUNT,
      notifications: notificationsResult.rows,
      earns: earnsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

router.get('/activities', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT ActivityID, Type, Duration, Distance, "Date", UserID
       FROM ACTIVITY
       WHERE UserID = :userId
       ORDER BY "Date" DESC`,
      { userId: req.user.UserID }
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.post('/activities', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const { Type, Duration, Distance, Date } = req.body;

    if (!Type || Duration == null || Distance == null || !Date) {
      return res.status(400).json({
        error: "Type, Duration, Distance and Date are required"
      });
    }

    const result = await connection.execute(
      `INSERT INTO ACTIVITY
       (Type, Duration, Distance, "Date", UserID)
       VALUES
       (:activityType, :duration, :distance, TO_DATE(:activityDate, 'YYYY-MM-DD'), :userId)
       RETURNING ActivityID INTO :activityId`,
      {
        activityType: Type,
        duration: Number(Duration),
        distance: Number(Distance),
        activityDate: Date,
        userId: req.user.UserID,
        activityId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER
        }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Activity created successfully",
      ActivityID: result.outBinds.activityId[0]
    });

  } catch (error) {
    console.error("Create activity error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

router.get('/nutrition', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT NutritionID, MealType, Calories, Quantity, "Date", UserID
       FROM NUTRITION
       WHERE UserID = :userId
       ORDER BY "Date" DESC`,
      { userId: req.user.UserID }
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.post('/nutrition', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const {
      MealType,
      Calories,
      Quantity,
      Date,
      FoodItems
    } = req.body;

    if (
      !MealType ||
      Calories == null ||
      Quantity == null ||
      !Date
    ) {
      return res.status(400).json({
        error: "MealType, Calories, Quantity and Date are required"
      });
    }

    const foodItems = Array.isArray(FoodItems)
      ? FoodItems.filter(item => item && item.trim())
      : [];

    const nutritionResult = await connection.execute(
      `INSERT INTO NUTRITION
       (MealType, Calories, Quantity, "Date", UserID)
       VALUES
       (:mealType, :calories, :quantity,
        TO_DATE(:nutritionDate, 'YYYY-MM-DD'), :userId)
       RETURNING NutritionID INTO :nutritionId`,
      {
        mealType: MealType,
        calories: Number(Calories),
        quantity: Number(Quantity),
        nutritionDate: Date,
        userId: req.user.UserID,
        nutritionId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER
        }
      }
    );

    const nutritionId = nutritionResult.outBinds.nutritionId[0];

    for (const foodItem of foodItems) {
      await connection.execute(
        `INSERT INTO NUTRITION_FOODITEM
         (NutritionID, FoodItem)
         VALUES
         (:nutritionId, :foodItem)`,
        {
          nutritionId,
          foodItem
        }
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Nutrition added successfully",
      NutritionID: nutritionId
    });

  } catch (error) {
    console.error("Create nutrition error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

router.get('/goals', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT GoalID, GoalType, TargetValue, Deadline, UserID
       FROM GOAL
       WHERE UserID = :userId`,
      { userId: req.user.UserID }
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.post('/goals', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const {
      GoalType,
      TargetValue,
      Deadline
    } = req.body;

    if (!GoalType || TargetValue == null || !Deadline) {
      return res.status(400).json({
        error: "GoalType, TargetValue and Deadline are required"
      });
    }

    const result = await connection.execute(
      `INSERT INTO GOAL
       (GoalType, TargetValue, Deadline, UserID)
       VALUES
       (:goalType, :targetValue,
        TO_DATE(:deadline, 'YYYY-MM-DD'), :userId)
       RETURNING GoalID INTO :goalId`,
      {
        goalType: GoalType,
        targetValue: Number(TargetValue),
        deadline: Deadline,
        userId: req.user.UserID,
        goalId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER
        }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Goal created successfully",
      GoalID: result.outBinds.goalId[0]
    });

  } catch (error) {
    console.error("Create goal error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.get('/devices', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT DeviceID, Brand, Model, SerialNumber, UserID
       FROM WEARABLE_DEVICE
       WHERE UserID = :userId`,
      { userId: req.user.UserID }
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.post('/devices', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const {
      Brand,
      Model,
      SerialNumber,
      Features,
      DeviceType,
      HasGPS,
      WaterResistance,
      BandMaterial,
      HasHRSensor
    } = req.body;

    if (!Brand || !Model || !SerialNumber) {
      return res.status(400).json({
        error: "Brand, Model and SerialNumber are required"
      });
    }

    const deviceResult = await connection.execute(
      `INSERT INTO WEARABLE_DEVICE
       (Brand, Model, SerialNumber, UserID)
       VALUES
       (:brand, :model, :serialNumber, :userId)
       RETURNING DeviceID INTO :deviceId`,
      {
        brand: Brand,
        model: Model,
        serialNumber: SerialNumber,
        userId: req.user.UserID,
        deviceId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER
        }
      }
    );

    const deviceId = deviceResult.outBinds.deviceId[0];

    const features = Array.isArray(Features)
      ? Features.filter(feature => feature && feature.trim())
      : [];

    for (const feature of features) {
      await connection.execute(
        `INSERT INTO DEVICE_FEATURE
         (DeviceID, FeatureName)
         VALUES
         (:deviceId, :featureName)`,
        {
          deviceId,
          featureName: feature
        }
      );
    }

    if (DeviceType === "Smartwatch") {
      await connection.execute(
        `INSERT INTO SMARTWATCH
         (DeviceID, HasGPS, WaterResistance)
         VALUES
         (:deviceId, :hasGPS, :waterResistance)`,
        {
          deviceId,
          hasGPS: HasGPS ? "Yes" : "No",
          waterResistance: WaterResistance || null
        }
      );
    }

    if (DeviceType === "Fitness Band") {
      await connection.execute(
        `INSERT INTO FITNESS_BAND
         (DeviceID, BandMaterial, HasHRSensor)
         VALUES
         (:deviceId, :bandMaterial, :hasHRSensor)`,
        {
          deviceId,
          bandMaterial: BandMaterial || null,
          hasHRSensor: HasHRSensor ? "Yes" : "No"
        }
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Device created successfully",
      DeviceID: deviceId
    });

  } catch (error) {
    console.error("Create device error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});


router.get('/trainers', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         t.UserID AS "TrainerID",
         u.FirstName AS "TrainerFirstName",
         u.LastName AS "TrainerLastName",
         t.CertificationNo AS "CertificationNo",
         t.YearsExperience AS "YearsExperience",
         COUNT(DISTINCT s.UserID) AS "AthleteCount"
       FROM TRAINER t
       JOIN USERS u
         ON t.UserID = u.UserID
       LEFT JOIN SUPERVISION s
         ON s.TrainerID = t.UserID
       GROUP BY
         t.UserID,
         u.FirstName,
         u.LastName,
         t.CertificationNo,
         t.YearsExperience
       ORDER BY t.UserID`,
      {}
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get trainers error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.get('/health', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         h.DeviceID,
         h.MetricID,
         h.MetricType,
         h.Value,
         h.Unit,
         h.Timestamp,
         w.Brand,
         w.Model
       FROM HEALTH_METRIC h
       JOIN WEARABLE_DEVICE w
         ON h.DeviceID = w.DeviceID
       WHERE w.UserID = :userId
       ORDER BY h.Timestamp DESC`,
      { userId: req.user.UserID }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get health metrics error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.post('/health', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const {
      DeviceID,
      MetricType,
      Value,
      Unit,
      Timestamp
    } = req.body;

    if (
      DeviceID == null ||
      !MetricType ||
      Value == null ||
      !Unit ||
      !Timestamp
    ) {
      return res.status(400).json({
        error: "DeviceID, MetricType, Value, Unit and Timestamp are required"
      });
    }

    const deviceCheck = await connection.execute(
      `SELECT DeviceID
       FROM WEARABLE_DEVICE
       WHERE DeviceID = :deviceId
       AND UserID = :userId`,
      {
        deviceId: Number(DeviceID),
        userId: req.user.UserID
      }
    );

    if (deviceCheck.rows.length === 0) {
      return res.status(403).json({
        error: "You can only add health metrics to your own device"
      });
    }

    const result = await connection.execute(
      `INSERT INTO HEALTH_METRIC
       (DeviceID, MetricType, Value, Unit, Timestamp)
       VALUES
       (:deviceId, :metricType, :metricValue, :metricUnit,
        TO_TIMESTAMP(:metricTimestamp, 'YYYY-MM-DD HH24:MI:SS'))
       RETURNING MetricID INTO :metricId`,
      {
        deviceId: Number(DeviceID),
        metricType: MetricType,
        metricValue: Number(Value),
        metricUnit: Unit,
        metricTimestamp: Timestamp,
        metricId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER
        }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Health metric added successfully",
      MetricID: result.outBinds.metricId[0]
    });

  } catch (error) {
    console.error("Create health metric error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.get('/achievements', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         a.AchievementID AS "AchievementID",
         a.Title AS "Title",
         a.Description AS "Description",
         TO_CHAR(a.DateAwarded, 'YYYY-MM-DD') AS "DateAwarded",
         e.ActivityID AS "ActivityID",
         act.Type AS "ActivityType",
         act.Distance AS "Distance",
         act.Duration AS "Duration",
         TO_CHAR(act."Date", 'YYYY-MM-DD') AS "ActivityDate"
       FROM ACHIEVEMENT a
       JOIN EARNS e
         ON a.AchievementID = e.AchievementID
       JOIN ACTIVITY act
         ON e.ActivityID = act.ActivityID
       WHERE act.UserID = :userId
       ORDER BY a.DateAwarded DESC`,
      {
        userId: req.user.UserID
      }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get achievements error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.post('/achievements', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const {
      Title,
      Description,
      DateAwarded,
      ActivityID
    } = req.body;

    if (!Title || !Description || !DateAwarded || ActivityID == null) {
      return res.status(400).json({
        error: "Title, Description, DateAwarded and ActivityID are required"
      });
    }

    const activityCheck = await connection.execute(
      `SELECT ActivityID
       FROM ACTIVITY
       WHERE ActivityID = :activityId
       AND UserID = :userId`,
      {
        activityId: Number(ActivityID),
        userId: req.user.UserID
      }
    );

    if (activityCheck.rows.length === 0) {
      return res.status(403).json({
        error: "You can only create achievements for your own activities"
      });
    }

    const achievementResult = await connection.execute(
      `INSERT INTO ACHIEVEMENT
       (Title, Description, DateAwarded)
       VALUES
       (:title, :description,
        TO_DATE(:dateAwarded, 'YYYY-MM-DD'))
       RETURNING AchievementID INTO :achievementId`,
      {
        title: Title,
        description: Description,
        dateAwarded: DateAwarded,
        achievementId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER
        }
      }
    );

    const achievementId =
      achievementResult.outBinds.achievementId[0];

    await connection.execute(
      `INSERT INTO EARNS
       (ActivityID, AchievementID)
       VALUES
       (:activityId, :achievementId)`,
      {
        activityId: Number(ActivityID),
        achievementId
      }
    );

    await connection.commit();

    res.status(201).json({
      message: "Achievement created successfully",
      AchievementID: achievementId
    });

  } catch (error) {
    console.error("Create achievement error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.get('/social/users', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         u.UserID,
         u.FirstName,
         u.LastName,
         u.Email,
         CASE
           WHEN uf.FollowerID IS NOT NULL THEN 1
           ELSE 0
         END AS IsFollowing
       FROM USERS u
       LEFT JOIN USER_FOLLOWS uf
         ON uf.FolloweeID = u.UserID
        AND uf.FollowerID = :userId
       WHERE u.UserID != :userId
       ORDER BY u.UserID`,
      {
        userId: req.user.UserID
      }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get social users error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.post('/social/follow/:userId', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const followeeId = Number(req.params.userId);
    const followerId = req.user.UserID;

    if (followeeId === followerId) {
      return res.status(400).json({
        error: "You cannot follow yourself"
      });
    }

    const userCheck = await connection.execute(
      `SELECT UserID
       FROM USERS
       WHERE UserID = :userId`,
      {
        userId: followeeId
      }
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const existing = await connection.execute(
      `SELECT FollowerID
       FROM USER_FOLLOWS
       WHERE FollowerID = :followerId
       AND FolloweeID = :followeeId`,
      {
        followerId,
        followeeId
      }
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "Already following this user"
      });
    }

    await connection.execute(
      `INSERT INTO USER_FOLLOWS
       (FollowerID, FolloweeID)
       VALUES
       (:followerId, :followeeId)`,
      {
        followerId,
        followeeId
      }
    );

    await connection.commit();

    res.status(201).json({
      message: "User followed successfully"
    });

  } catch (error) {
    console.error("Follow user error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});router.delete('/social/follow/:userId', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const followeeId = Number(req.params.userId);
    const followerId = req.user.UserID;

    await connection.execute(
      `DELETE FROM USER_FOLLOWS
       WHERE FollowerID = :followerId
       AND FolloweeID = :followeeId`,
      {
        followerId,
        followeeId
      }
    );

    await connection.commit();

    res.json({
      message: "User unfollowed successfully"
    });

  } catch (error) {
    console.error("Unfollow user error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});router.get('/social/followers', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         u.UserID,
         u.FirstName,
         u.LastName,
         u.Email
       FROM USER_FOLLOWS uf
       JOIN USERS u
         ON u.UserID = uf.FollowerID
       WHERE uf.FolloweeID = :userId
       ORDER BY u.UserID`,
      {
        userId: req.user.UserID
      }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get followers error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});router.get('/social/following', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         u.UserID,
         u.FirstName,
         u.LastName,
         u.Email
       FROM USER_FOLLOWS uf
       JOIN USERS u
         ON u.UserID = uf.FolloweeID
       WHERE uf.FollowerID = :userId
       ORDER BY u.UserID`,
      {
        userId: req.user.UserID
      }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get following error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.get('/trainers/:trainerId/athletes', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const trainerId = Number(req.params.trainerId);

    const result = await connection.execute(
      `SELECT
         s.TrainerID AS "TrainerID",
         s.UserID AS "AthleteID",
         u.FirstName AS "AthleteFirstName",
         u.LastName AS "AthleteLastName",
         a.SportType AS "SportType",
         a.SkillLevel AS "SkillLevel",
         s.ActivityID AS "ActivityID",
         act.Type AS "ActivityType",
         act.Duration AS "Duration",
         act.Distance AS "Distance",
         TO_CHAR(act."Date", 'YYYY-MM-DD') AS "ActivityDate",
         s.SessionNotes AS "SessionNotes",
         s.PerformanceRating AS "PerformanceRating"
       FROM SUPERVISION s
       JOIN USERS u
         ON u.UserID = s.UserID
       JOIN ATHLETE a
         ON a.UserID = s.UserID
       JOIN ACTIVITY act
         ON act.ActivityID = s.ActivityID
       WHERE s.TrainerID = :trainerId
       ORDER BY s.UserID, act."Date" DESC`,
      {
        trainerId
      }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get trainer athletes error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.get('/notifications', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         n.RecipientID AS "RecipientID",
         n.SourceType AS "SourceType",
         n.UserID AS "UserID",
         u.FirstName AS "FirstName",
         u.LastName AS "LastName",
         n.TrainerUserID AS "TrainerUserID",
         tu.FirstName AS "TrainerFirstName",
         tu.LastName AS "TrainerLastName",
         n.ContactChannel AS "ContactChannel",
         n.NotificationPref AS "NotificationPref"
       FROM NOTIFICATION_RECIPIENT n
       JOIN USERS u
         ON n.UserID = u.UserID
       LEFT JOIN TRAINER t
         ON n.TrainerUserID = t.UserID
       LEFT JOIN USERS tu
         ON t.UserID = tu.UserID
       WHERE n.UserID = :userId
       ORDER BY n.RecipientID`,
      {
        userId: req.user.UserID
      }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.post('/notifications', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const {
      SourceType,
      TrainerUserID,
      ContactChannel,
      NotificationPref
    } = req.body;

    if (
      !SourceType ||
      !ContactChannel ||
      !NotificationPref
    ) {
      return res.status(400).json({
        error: "SourceType, ContactChannel and NotificationPref are required"
      });
    }

    if (TrainerUserID != null) {
      const trainerCheck = await connection.execute(
        `SELECT UserID
         FROM TRAINER
         WHERE UserID = :trainerUserId`,
        {
          trainerUserId: Number(TrainerUserID)
        }
      );

      if (trainerCheck.rows.length === 0) {
        return res.status(400).json({
          error: "Invalid trainer"
        });
      }
    }

    const result = await connection.execute(
      `INSERT INTO NOTIFICATION_RECIPIENT
       (
         SourceType,
         UserID,
         TrainerUserID,
         ContactChannel,
         NotificationPref
       )
       VALUES
       (
         :sourceType,
         :userId,
         :trainerUserId,
         :contactChannel,
         :notificationPref
       )
       RETURNING RecipientID INTO :recipientId`,
      {
        sourceType: SourceType,
        userId: req.user.UserID,
        trainerUserId:
          TrainerUserID != null
            ? Number(TrainerUserID)
            : null,
        contactChannel: ContactChannel,
        notificationPref: NotificationPref,
        recipientId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER
        }
      },
      {
        autoCommit: true
      }
    );

    res.status(201).json({
      message: "Notification setting created successfully",
      RecipientID: result.outBinds.recipientId[0]
    });

  } catch (error) {
    console.error("Create notification error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.delete('/notifications/:recipientId', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const recipientId = Number(req.params.recipientId);

    const result = await connection.execute(
      `DELETE FROM NOTIFICATION_RECIPIENT
       WHERE RecipientID = :recipientId
       AND UserID = :userId`,
      {
        recipientId,
        userId: req.user.UserID
      },
      {
        autoCommit: true
      }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Notification setting not found"
      });
    }

    res.json({
      message: "Notification setting deleted successfully"
    });

  } catch (error) {
    console.error("Delete notification error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.get('/profile', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         u.UserID AS "UserID",
         u.FirstName AS "FirstName",
         u.LastName AS "LastName",
         u.Email AS "Email",
         TO_CHAR(u.DOB, 'YYYY-MM-DD') AS "DOB",
         u.Gender AS "Gender",
         p.PhoneNumber AS "PhoneNumber"
       FROM USERS u
       LEFT JOIN USER_PHONE p
         ON u.UserID = p.UserID
       WHERE u.UserID = :userId`,
      {
        userId: req.user.UserID
      }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});
router.put('/profile', auth, async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const {
      FirstName,
      LastName,
      Email,
      DOB,
      Gender,
      PhoneNumber
    } = req.body;

    if (!FirstName || !LastName || !Email || !DOB || !Gender) {
      return res.status(400).json({
        error: "FirstName, LastName, Email, DOB and Gender are required"
      });
    }

    await connection.execute(
      `UPDATE USERS
       SET
         FirstName = :firstName,
         LastName = :lastName,
         Email = :email,
         DOB = TO_DATE(:dob, 'YYYY-MM-DD'),
         Gender = :gender
       WHERE UserID = :userId`,
      {
        firstName: FirstName,
        lastName: LastName,
        email: Email,
        dob: DOB,
        gender: Gender,
        userId: req.user.UserID
      }
    );

    if (PhoneNumber && PhoneNumber.trim() !== "") {

      const phoneCheck = await connection.execute(
        `SELECT UserID
         FROM USER_PHONE
         WHERE UserID = :userId`,
        {
          userId: req.user.UserID
        }
      );

      if (phoneCheck.rows.length > 0) {
        await connection.execute(
          `UPDATE USER_PHONE
           SET PhoneNumber = :phoneNumber
           WHERE UserID = :userId`,
          {
            phoneNumber: PhoneNumber.trim(),
            userId: req.user.UserID
          }
        );
      } else {
        await connection.execute(
          `INSERT INTO USER_PHONE
           (UserID, PhoneNumber)
           VALUES
           (:userId, :phoneNumber)`,
          {
            userId: req.user.UserID,
            phoneNumber: PhoneNumber.trim()
          }
        );
      }

    } else {
      await connection.execute(
        `DELETE FROM USER_PHONE
         WHERE UserID = :userId`,
        {
          userId: req.user.UserID
        }
      );
    }

    await connection.commit();

    res.json({
      message: "Profile updated successfully"
    });

  } catch (error) {
    console.error("Update profile error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }

    res.status(500).json({
      error: error.message
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

module.exports = router;