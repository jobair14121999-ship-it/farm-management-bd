

import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'farm_management_bd_final_v1';

const taka = (n) =>
  `৳ ${Number(n || 0).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })}`;

const today = () =>
  new Date().toISOString().slice(0, 10);

const nowTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const uid = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

const emptyBatch = () => ({
  id: null,
  startDate: null,

  liveBirds: 0,
  totalAdded: 0,
  totalDead: 0,
  totalSold: 0,

  totalExpense: 0,
  totalSales: 0,
});

function HistoryEntry({ entry }) {
  return (
    <View style={styles.historyEntry}>
      <View style={styles.historyTimeRow}>
        <Text style={styles.historyDate}>
          📅 {entry.date}
        </Text>

        <Text style={styles.historyTime}>
          🕒 {entry.time}
        </Text>
      </View>

      <Text style={styles.historyTitle}>
        {entry.title}
      </Text>

      <Text style={styles.historyDetail}>
        {entry.detail}
      </Text>
    </View>
  );
}

export default function App({ storageKey = STORAGE_KEY }) {
  const [tab, setTab] = useState('home');

  const [batch, setBatch] = useState(emptyBatch());

  const [allHistory, setAllHistory] = useState([]);

  const [
    currentBatchHistory,
    setCurrentBatchHistory,
  ] = useState([]);

  const [
    lastBatchSummary,
    setLastBatchSummary,
  ] = useState(null);

  const [date, setDate] = useState(today());

  // CHICKEN
  const [newBirdQty, setNewBirdQty] = useState('');
  const [newBirdPrice, setNewBirdPrice] =
    useState('');
  const [deadBirdQty, setDeadBirdQty] =
    useState('');

  // FEED
  const [feedBags, setFeedBags] = useState('');
  const [
    feedPricePerBag,
    setFeedPricePerBag,
  ] = useState('');

  // MEDICINE
  const [medicineName, setMedicineName] =
    useState('');
  const [
    medicineAmount,
    setMedicineAmount,
  ] = useState('');

  // OTHER
  const [otherName, setOtherName] =
    useState('');
  const [otherAmount, setOtherAmount] =
    useState('');

  // SALE
  const [saleBirds, setSaleBirds] =
    useState('');
  const [saleKg, setSaleKg] = useState('');
  const [salePriceKg, setSalePriceKg] =
    useState('');

  // HISTORY SEARCH
  const [searchDate, setSearchDate] =
    useState('');
  const [searching, setSearching] =
    useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const saveStorage = async (
    nextBatch,
    nextAllHistory,
    nextCurrentHistory,
    nextLastSummary
  ) => {
    try {
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          batch: nextBatch,
          allHistory: nextAllHistory,
          currentBatchHistory:
            nextCurrentHistory,
          lastBatchSummary:
            nextLastSummary,
        })
      );
    } catch (e) {
      Alert.alert(
        'Storage Error',
        'ডাটা সংরক্ষণ করা যায়নি।'
      );
    }
  };

  const loadData = async () => {
    try {
      const raw =
        await AsyncStorage.getItem(
          storageKey
        );

      if (!raw) return;

      const data = JSON.parse(raw);

      if (data.batch) {
        setBatch(data.batch);
      }

      if (data.allHistory) {
        setAllHistory(data.allHistory);
      }

      if (data.currentBatchHistory) {
        setCurrentBatchHistory(
          data.currentBatchHistory
        );
      }

      if (data.lastBatchSummary) {
        setLastBatchSummary(
          data.lastBatchSummary
        );
      }
    } catch (e) {
      console.log(e);
    }
  };

  const chickenPurchaseTotal =
    Number(newBirdQty || 0) *
    Number(newBirdPrice || 0);

  const feedTotal =
    Number(feedBags || 0) *
    Number(feedPricePerBag || 0);

  const medicineTotal =
    Number(medicineAmount || 0);

  const otherTotal =
    Number(otherAmount || 0);

  const dailyExpense =
    chickenPurchaseTotal +
    feedTotal +
    medicineTotal +
    otherTotal;

  const saleTotal =
    Number(saleKg || 0) *
    Number(salePriceKg || 0);

  const previewLiveAfterDaily =
    batch.liveBirds +
    Number(newBirdQty || 0) -
    Number(deadBirdQty || 0);

  const previewLiveAfterSale =
    batch.liveBirds -
    Number(saleBirds || 0);

  const resetDailyForm = () => {
    setDate(today());

    setNewBirdQty('');
    setNewBirdPrice('');
    setDeadBirdQty('');

    setFeedBags('');
    setFeedPricePerBag('');

    setMedicineName('');
    setMedicineAmount('');

    setOtherName('');
    setOtherAmount('');
  };

  const resetSaleForm = () => {
    setDate(today());

    setSaleBirds('');
    setSaleKg('');
    setSalePriceKg('');
  };

  const saveDaily = async () => {
    const addQty =
      Number(newBirdQty || 0);

    const deadQty =
      Number(deadBirdQty || 0);

    const hasChicken =
      addQty > 0 || deadQty > 0;

    const hasFeed =
      Number(feedBags || 0) > 0;

    const hasMedicine =
      medicineName.trim() !== '' ||
      medicineTotal > 0;

    const hasOther =
      otherName.trim() !== '' ||
      otherTotal > 0;

    if (
      !hasChicken &&
      !hasFeed &&
      !hasMedicine &&
      !hasOther
    ) {
      Alert.alert(
        'কিছু লিখুন',
        'সংরক্ষণ করার মতো কোনো হিসাব দেওয়া হয়নি।'
      );
      return;
    }

    if (!batch.id && addQty <= 0) {
      Alert.alert(
        'নতুন ব্যাচ শুরু করুন',
        'প্রথমে নতুন মুরগির সংখ্যা দিন।'
      );
      return;
    }

    const startingNewBatch =
      !batch.id && addQty > 0;

    const workingBatch =
      startingNewBatch
        ? {
            ...emptyBatch(),
            id: uid(),
            startDate: date,
          }
        : batch;

    const newLive =
      workingBatch.liveBirds +
      addQty -
      deadQty;

    if (newLive < 0) {
      Alert.alert(
        'ভুল সংখ্যা',
        'মারা যাওয়া মুরগি Live Balance-এর চেয়ে বেশি হতে পারবে না।'
      );
      return;
    }

    const entries = [];

    if (addQty > 0) {
      entries.push({
        id: uid(),
        batchId: workingBatch.id,
        date,
        time: nowTime(),
        type: 'chicken_add',
        title: '🐣 নতুন মুরগি',
        detail: `${addQty} পিস × ${taka(
          newBirdPrice
        )} = ${taka(
          chickenPurchaseTotal
        )}`,
        amount: chickenPurchaseTotal,
        qty: addQty,
        unitPrice: Number(
          newBirdPrice || 0
        ),
      });
    }

    if (deadQty > 0) {
      entries.push({
        id: uid(),
        batchId: workingBatch.id,
        date,
        time: nowTime(),
        type: 'death',
        title: '💀 মুরগি মারা গেছে',
        detail: `${deadQty} টি মুরগি মারা গেছে`,
        amount: 0,
        qty: deadQty,
      });
    }

    if (
      Number(feedBags || 0) > 0
    ) {
      entries.push({
        id: uid(),
        batchId: workingBatch.id,
        date,
        time: nowTime(),
        type: 'feed',
        title: '🌾 ফিড',
        detail: `${Number(
          feedBags
        )} বস্তা × ${taka(
          feedPricePerBag
        )} = ${taka(feedTotal)}`,
        amount: feedTotal,
        bags: Number(
          feedBags || 0
        ),
        pricePerBag: Number(
          feedPricePerBag || 0
        ),
      });
    }

    if (hasMedicine) {
      entries.push({
        id: uid(),
        batchId: workingBatch.id,
        date,
        time: nowTime(),
        type: 'medicine',
        title: '💊 ওষুধ',
        detail: `${
          medicineName.trim() ||
          'ওষুধ'
        } — ${taka(
          medicineTotal
        )}`,
        amount: medicineTotal,
        name: medicineName.trim(),
      });
    }

    if (hasOther) {
      entries.push({
        id: uid(),
        batchId: workingBatch.id,
        date,
        time: nowTime(),
        type: 'other',
        title: '🧾 অন্যান্য খরচ',
        detail: `${
          otherName.trim() ||
          'অন্যান্য খরচ'
        } — ${taka(otherTotal)}`,
        amount: otherTotal,
        name: otherName.trim(),
      });
    }

    const updatedBatch = {
      ...workingBatch,

      liveBirds: newLive,

      totalAdded:
        workingBatch.totalAdded +
        addQty,

      totalDead:
        workingBatch.totalDead +
        deadQty,

      totalExpense:
        workingBatch.totalExpense +
        dailyExpense,
    };

    const nextAllHistory = [
      ...entries,
      ...allHistory,
    ];

    const nextCurrentHistory = [
      ...entries,
      ...(startingNewBatch
        ? []
        : currentBatchHistory),
    ];

    const nextSummary =
      startingNewBatch
        ? null
        : lastBatchSummary;

    setBatch(updatedBatch);
    setAllHistory(
      nextAllHistory
    );
    setCurrentBatchHistory(
      nextCurrentHistory
    );
    setLastBatchSummary(
      nextSummary
    );

    await saveStorage(
      updatedBatch,
      nextAllHistory,
      nextCurrentHistory,
      nextSummary
    );

    resetDailyForm();

    Alert.alert(
      'সংরক্ষণ হয়েছে ✅',
      `Live Balance: ${newLive} টি`
    );

    setTab('home');
  };

  const saveSale = async () => {
    if (!batch.id) {
      Alert.alert(
        'Active batch নেই',
        'আগে নতুন মুরগি দিয়ে batch শুরু করুন।'
      );
      return;
    }

    const birds =
      Number(saleBirds || 0);

    const kg =
      Number(saleKg || 0);

    const priceKg =
      Number(salePriceKg || 0);

    if (
      birds <= 0 ||
      kg <= 0 ||
      priceKg <= 0
    ) {
      Alert.alert(
        'বিক্রির তথ্য দিন',
        'মুরগির সংখ্যা, মোট কেজি এবং প্রতি কেজির দাম দিন।'
      );
      return;
    }

    if (
      birds > batch.liveBirds
    ) {
      Alert.alert(
        'ভুল সংখ্যা',
        'Live Balance-এর চেয়ে বেশি মুরগি বিক্রি করা যাবে না।'
      );
      return;
    }

    const newLive =
      batch.liveBirds - birds;

    const entry = {
      id: uid(),
      batchId: batch.id,
      date,
      time: nowTime(),
      type: 'sale',
      title: '💰 মুরগি বিক্রি',
      detail: `${birds} টি • ${kg} কেজি × ${taka(
        priceKg
      )} = ${taka(saleTotal)}`,
      amount: saleTotal,
      birds,
      kg,
      pricePerKg: priceKg,
    };

    const updatedBatch = {
      ...batch,

      liveBirds: newLive,

      totalSold:
        batch.totalSold + birds,

      totalSales:
        batch.totalSales +
        saleTotal,
    };

    const nextAllHistory = [
      entry,
      ...allHistory,
    ];

    let nextCurrentHistory = [
      entry,
      ...currentBatchHistory,
    ];

    let nextBatch =
      updatedBatch;

    let nextSummary =
      lastBatchSummary;

    if (newLive === 0) {
      const result =
        updatedBatch.totalSales -
        updatedBatch.totalExpense;

      nextSummary = {
        id: uid(),
        startDate:
          updatedBatch.startDate,
        endDate: date,

        totalExpense:
          updatedBatch.totalExpense,

        totalSales:
          updatedBatch.totalSales,

        result,
      };

      nextBatch =
        emptyBatch();

      nextCurrentHistory = [];
    }

    setBatch(nextBatch);
    setAllHistory(
      nextAllHistory
    );
    setCurrentBatchHistory(
      nextCurrentHistory
    );
    setLastBatchSummary(
      nextSummary
    );

    await saveStorage(
      nextBatch,
      nextAllHistory,
      nextCurrentHistory,
      nextSummary
    );

    resetSaleForm();

    if (newLive === 0) {
      Alert.alert(
        'ব্যাচ শেষ ✅',
        `মোট খরচ: ${taka(
          nextSummary.totalExpense
        )}

মোট বিক্রি: ${taka(
          nextSummary.totalSales
        )}

${
  nextSummary.result >= 0
    ? `লাভ: ${taka(
        nextSummary.result
      )}`
    : `লস: ${taka(
        Math.abs(
          nextSummary.result
        )
      )}`
}`
      );
    } else {
      Alert.alert(
        'বিক্রি সংরক্ষণ হয়েছে ✅',
        `Live Balance: ${newLive} টি`
      );
    }

    setTab('home');
  };

  const searchedHistory =
    useMemo(() => {
      if (!searching) {
        return [];
      }

      return allHistory.filter(
        (x) =>
          x.date ===
          searchDate.trim()
      );
    }, [
      searching,
      searchDate,
      allHistory,
    ]);

  /* ======================
     DASHBOARD
     ====================== */

  const renderDashboard = () => (
    <ScrollView
      contentContainerStyle={
        styles.pageBottom
      }
    >
      <View style={styles.hero}>
        <View>
          <Text style={styles.appName}>
            Farm Management BD
          </Text>

          <Text style={styles.heroSub}>
            Poultry Farm Management
          </Text>
        </View>

        <Text style={styles.chicken}>
          🐔
        </Text>
      </View>

      <View style={styles.welcome}>
        <Text
          style={styles.welcomeTitle}
        >
          ফার্ম ড্যাশবোর্ড
        </Text>

        <Text style={styles.muted}>
          বর্তমান ব্যাচের লাইভ হিসাব
        </Text>
      </View>

      <View style={styles.stats}>
        <View
          style={[
            styles.statCard,
            styles.yellow,
          ]}
        >
          <Text style={styles.statIcon}>
            🐔
          </Text>

          <Text style={styles.statTitle}>
            Live Balance
          </Text>

          <Text style={styles.statValue}>
            {batch.liveBirds} টি
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            styles.red,
          ]}
        >
          <Text style={styles.statIcon}>
            💀
          </Text>

          <Text style={styles.statTitle}>
            মোট মারা গেছে
          </Text>

          <Text style={styles.statValue}>
            {batch.totalDead} টি
          </Text>
        </View>

        <View
          style={[
            styles.expenseCard,
            styles.green,
          ]}
        >
          <Text style={styles.statIcon}>
            💵
          </Text>

          <View>
            <Text style={styles.statTitle}>
              বর্তমান Batch মোট খরচ
            </Text>

            <Text
              style={styles.bigExpense}
            >
              {taka(
                batch.totalExpense
              )}
            </Text>
          </View>
        </View>
      </View>

      {!batch.id &&
        !lastBatchSummary && (
          <View style={styles.infoCard}>
            <Text
              style={styles.infoTitle}
            >
              নতুন ব্যাচ শুরু করুন
            </Text>

            <Text style={styles.muted}>
              “খরচ” থেকে নতুন মুরগি
              যোগ করলে নতুন ব্যাচ
              শুরু হবে।
            </Text>
          </View>
        )}

      {lastBatchSummary &&
        !batch.id && (
          <View
            style={
              styles.finalSummary
            }
          >
            <Text
              style={styles.finalTitle}
            >
              ✅ শেষ Batch-এর ফলাফল
            </Text>

            <Text>
              শুরু:{' '}
              {
                lastBatchSummary.startDate
              }
            </Text>

            <Text>
              শেষ:{' '}
              {
                lastBatchSummary.endDate
              }
            </Text>

            <View
              style={styles.divider}
            />

            <View style={styles.row}>
              <Text>মোট খরচ</Text>

              <Text
                style={styles.bold}
              >
                {taka(
                  lastBatchSummary.totalExpense
                )}
              </Text>
            </View>

            <View style={styles.row}>
              <Text>মোট বিক্রি</Text>

              <Text
                style={styles.bold}
              >
                {taka(
                  lastBatchSummary.totalSales
                )}
              </Text>
            </View>

            <View
              style={styles.divider}
            />

            <View style={styles.row}>
              <Text
                style={
                  styles.finalResultLabel
                }
              >
                {lastBatchSummary.result >=
                0
                  ? 'মোট লাভ'
                  : 'মোট লস'}
              </Text>

              <Text
                style={[
                  styles.finalResult,
                  lastBatchSummary.result <
                    0 &&
                    styles.loss,
                ]}
              >
                {taka(
                  Math.abs(
                    lastBatchSummary.result
                  )
                )}
              </Text>
            </View>
          </View>
        )}

      <View style={styles.historyBox}>
        <View
          style={styles.historyHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            বর্তমান Batch History
          </Text>

          <TouchableOpacity
            onPress={() =>
              setTab('history')
            }
          >
            <Text style={styles.link}>
              সব History
            </Text>
          </TouchableOpacity>
        </View>

        {currentBatchHistory.length ===
        0 ? (
          <Text style={styles.empty}>
            বর্তমান batch-এ এখনো কোনো
            entry নেই।
          </Text>
        ) : (
          currentBatchHistory.map(
            (entry) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
              />
            )
          )
        )}
      </View>
    </ScrollView>
  );

  /* ======================
     DAILY EXPENSE
     ====================== */

  const renderDaily = () => (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={
        styles.formPage
      }
    >
      <Text style={styles.pageTitle}>
        দৈনিক হিসাব
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          📅 তারিখ
        </Text>

        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.card}>
        <Text
          style={styles.sectionTitle}
        >
          🐔 মুরগি
        </Text>

        <Text
          style={styles.subHeading}
        >
          নতুন মুরগি যোগ
        </Text>

        <Text style={styles.label}>
          কত পিস মুরগি এসেছে
        </Text>

        <TextInput
          style={styles.input}
          value={newBirdQty}
          onChangeText={setNewBirdQty}
          keyboardType="number-pad"
          placeholder="0"
        />

        <Text style={styles.label}>
          প্রতি পিসের দাম
        </Text>

        <View style={styles.moneyRow}>
          <TextInput
            style={styles.moneyInput}
            value={newBirdPrice}
            onChangeText={
              setNewBirdPrice
            }
            keyboardType="decimal-pad"
            placeholder="0"
          />

          <Text
            style={styles.currency}
          >
            ৳
          </Text>
        </View>

        <View style={styles.subtotal}>
          <Text>
            মুরগি কেনার মোট টাকা
          </Text>

          <Text style={styles.bold}>
            {taka(
              chickenPurchaseTotal
            )}
          </Text>
        </View>

        <View style={styles.line} />

        <Text
          style={styles.subHeading}
        >
          আজ মারা গেছে
        </Text>

        <TextInput
          style={styles.input}
          value={deadBirdQty}
          onChangeText={setDeadBirdQty}
          keyboardType="number-pad"
          placeholder="কতটি মারা গেছে"
        />

        <View
          style={styles.livePreview}
        >
          <Text>
            Save করার পর Live Balance
          </Text>

          <Text
            style={[
              styles.liveText,
              previewLiveAfterDaily <
                0 && styles.loss,
            ]}
          >
            {previewLiveAfterDaily} টি
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text
          style={styles.sectionTitle}
        >
          🌾 ফিড
        </Text>

        <Text style={styles.label}>
          কত বস্তা ফিড এসেছে
        </Text>

        <TextInput
          style={styles.input}
          value={feedBags}
          onChangeText={setFeedBags}
          keyboardType="decimal-pad"
          placeholder="0"
        />

        <Text style={styles.label}>
          প্রতি বস্তার দাম
        </Text>

        <View style={styles.moneyRow}>
          <TextInput
            style={styles.moneyInput}
            value={feedPricePerBag}
            onChangeText={
              setFeedPricePerBag
            }
            keyboardType="decimal-pad"
            placeholder="0"
          />

          <Text
            style={styles.currency}
          >
            ৳
          </Text>
        </View>

        <View style={styles.subtotal}>
          <Text>ফিড Subtotal</Text>

          <Text style={styles.bold}>
            {taka(feedTotal)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text
          style={styles.sectionTitle}
        >
          💊 ওষুধ
        </Text>

        <TextInput
          style={styles.input}
          value={medicineName}
          onChangeText={
            setMedicineName
          }
          placeholder="ওষুধের নাম"
        />

        <View style={styles.moneyRow}>
          <TextInput
            style={styles.moneyInput}
            value={medicineAmount}
            onChangeText={
              setMedicineAmount
            }
            keyboardType="decimal-pad"
            placeholder="ওষুধের দাম"
          />

          <Text
            style={styles.currency}
          >
            ৳
          </Text>
        </View>

        <View style={styles.subtotal}>
          <Text>ওষুধ খরচ</Text>

          <Text style={styles.bold}>
            {taka(medicineTotal)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text
          style={styles.sectionTitle}
        >
          🧾 অন্যান্য খরচ
        </Text>

        <TextInput
          style={styles.input}
          value={otherName}
          onChangeText={setOtherName}
          placeholder="যেমন: ফিড গাড়ি ভাড়া / বিদ্যুৎ বিল"
        />

        <View style={styles.moneyRow}>
          <TextInput
            style={styles.moneyInput}
            value={otherAmount}
            onChangeText={
              setOtherAmount
            }
            keyboardType="decimal-pad"
            placeholder="টাকার পরিমাণ"
          />

          <Text
            style={styles.currency}
          >
            ৳
          </Text>
        </View>

        <View style={styles.subtotal}>
          <Text>অন্যান্য খরচ</Text>

          <Text style={styles.bold}>
            {taka(otherTotal)}
          </Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text
          style={styles.totalTitle}
        >
          এই Save-এর মোট খরচ
        </Text>

        <View style={styles.row}>
          <Text>মুরগি কেনা</Text>
          <Text>
            {taka(
              chickenPurchaseTotal
            )}
          </Text>
        </View>

        <View style={styles.row}>
          <Text>ফিড</Text>
          <Text>
            {taka(feedTotal)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text>ওষুধ</Text>
          <Text>
            {taka(medicineTotal)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text>অন্যান্য</Text>
          <Text>
            {taka(otherTotal)}
          </Text>
        </View>

        <View
          style={styles.divider}
        />

        <View style={styles.row}>
          <Text
            style={styles.totalStrong}
          >
            TOTAL
          </Text>

          <Text
            style={styles.totalMoney}
          >
            {taka(dailyExpense)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveDaily}
      >
        <Text style={styles.saveText}>
          💾 সংরক্ষণ করুন
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  /* ======================
     SALE
     ====================== */

  const renderSale = () => {
    const currentResult =
      batch.totalSales +
      saleTotal -
      batch.totalExpense;

    const hasSale =
      batch.totalSales > 0 ||
      saleTotal > 0;

    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.formPage
        }
      >
        <Text style={styles.pageTitle}>
          বিক্রির হিসাব
        </Text>

        <View style={styles.card}>
          <Text style={styles.muted}>
            বর্তমান Live Balance
          </Text>

          <Text style={styles.bigLive}>
            {batch.liveBirds} টি
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            📅 তারিখ
          </Text>

          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>
            কতটি মুরগি বিক্রি
          </Text>

          <TextInput
            style={styles.input}
            value={saleBirds}
            onChangeText={setSaleBirds}
            keyboardType="number-pad"
            placeholder="0"
          />

          <Text style={styles.label}>
            মোট কত কেজি
          </Text>

          <TextInput
            style={styles.input}
            value={saleKg}
            onChangeText={setSaleKg}
            keyboardType="decimal-pad"
            placeholder="0"
          />

          <Text style={styles.label}>
            প্রতি কেজির দাম
          </Text>

          <View
            style={styles.moneyRow}
          >
            <TextInput
              style={styles.moneyInput}
              value={salePriceKg}
              onChangeText={
                setSalePriceKg
              }
              keyboardType="decimal-pad"
              placeholder="0"
            />

            <Text
              style={styles.currency}
            >
              ৳
            </Text>
          </View>

          <View
            style={styles.subtotal}
          >
            <Text>
              এই বিক্রির মোট টাকা
            </Text>

            <Text style={styles.bold}>
              {taka(saleTotal)}
            </Text>
          </View>
        </View>

        <View
          style={styles.saleSummary}
        >
          <Text
            style={styles.totalTitle}
          >
            বর্তমান Batch হিসাব
          </Text>

          <View style={styles.row}>
            <Text>মোট খরচ</Text>

            <Text>
              {taka(
                batch.totalExpense
              )}
            </Text>
          </View>

          <View style={styles.row}>
            <Text>
              বিক্রি হয়েছে মোট
            </Text>

            <Text>
              {taka(
                batch.totalSales +
                  saleTotal
              )}
            </Text>
          </View>

          {hasSale && (
            <>
              <View
                style={styles.divider}
              />

              <View style={styles.row}>
                <Text
                  style={
                    styles.totalStrong
                  }
                >
                  {currentResult >= 0
                    ? 'বর্তমান লাভ'
                    : 'বর্তমান ঘাটতি'}
                </Text>

                <Text
                  style={[
                    styles.totalMoney,
                    currentResult < 0 &&
                      styles.loss,
                  ]}
                >
                  {taka(
                    Math.abs(
                      currentResult
                    )
                  )}
                </Text>
              </View>
            </>
          )}

          <View
            style={styles.livePreview}
          >
            <Text>
              Save-এর পর Live
            </Text>

            <Text
              style={[
                styles.liveText,
                previewLiveAfterSale <
                  0 && styles.loss,
              ]}
            >
              {previewLiveAfterSale} টি
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSale}
        >
          <Text
            style={styles.saveText}
          >
            💾 বিক্রি সংরক্ষণ করুন
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  /* ======================
     HISTORY
     ====================== */

  const renderHistory = () => (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={
        styles.formPage
      }
    >
      <Text style={styles.pageTitle}>
        History
      </Text>

      <View style={styles.card}>
        <Text
          style={styles.sectionTitle}
        >
          🔎 তারিখ দিয়ে খুঁজুন
        </Text>

        <Text style={styles.muted}>
          যেমন: 2026-09-04
        </Text>

        <TextInput
          style={[
            styles.input,
            { marginTop: 12 },
          ]}
          value={searchDate}
          onChangeText={(v) => {
            setSearchDate(v);
            setSearching(false);
          }}
          placeholder="YYYY-MM-DD"
        />

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() =>
            setSearching(true)
          }
        >
          <Text
            style={styles.searchText}
          >
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {!searching && (
        <>
          <Text
            style={styles.archiveTitle}
          >
            সব History
          </Text>

          {allHistory.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.empty}>
                এখনো কোনো History নেই।
              </Text>
            </View>
          ) : (
            allHistory.map(
              (entry) => (
                <View
                  key={entry.id}
                  style={
                    styles.historySingleCard
                  }
                >
                  <HistoryEntry
                    entry={entry}
                  />
                </View>
              )
            )
          )}
        </>
      )}

      {searching &&
        searchedHistory.length ===
          0 && (
          <View style={styles.card}>
            <Text
              style={styles.notFound}
            >
              এই তারিখে কোনো হিসাব পাওয়া
              যায়নি।
            </Text>
          </View>
        )}

      {searching &&
        searchedHistory.length > 0 && (
          <>
            <Text
              style={
                styles.archiveTitle
              }
            >
              {searchDate} তারিখের হিসাব
            </Text>

            {searchedHistory.map(
              (entry) => (
                <View
                  key={entry.id}
                  style={
                    styles.historySingleCard
                  }
                >
                  <HistoryEntry
                    entry={entry}
                  />
                </View>
              )
            )}
          </>
        )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.app}>
        <View style={styles.main}>
          {tab === 'home' &&
            renderDashboard()}

          {tab === 'daily' &&
            renderDaily()}

          {tab === 'sale' &&
            renderSale()}

          {tab === 'history' &&
            renderHistory()}
        </View>

        <View style={styles.nav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setTab('home')
            }
          >
            <Text
              style={styles.navIcon}
            >
              🏠
            </Text>

            <Text
              style={[
                styles.navText,
                tab === 'home' &&
                  styles.navActive,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setTab('daily')
            }
          >
            <Text
              style={styles.navIcon}
            >
              📋
            </Text>

            <Text
              style={[
                styles.navText,
                tab === 'daily' &&
                  styles.navActive,
              ]}
            >
              খরচ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.centerButton
            }
            onPress={() =>
              setTab('daily')
            }
          >
            <Text style={styles.plus}>
              ＋
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setTab('sale')
            }
          >
            <Text
              style={styles.navIcon}
            >
              💰
            </Text>

            <Text
              style={[
                styles.navText,
                tab === 'sale' &&
                  styles.navActive,
              ]}
            >
              বিক্রি
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              setTab('history')
            }
          >
            <Text
              style={styles.navIcon}
            >
              🕘
            </Text>

            <Text
              style={[
                styles.navText,
                tab === 'history' &&
                  styles.navActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7f5',
  },

  app: {
    flex: 1,
  },

  main: {
    flex: 1,
  },

  pageBottom: {
    paddingBottom: 110,
  },

  formPage: {
    padding: 13,
    paddingBottom: 120,
  },

  hero: {
    backgroundColor: '#087c41',
    paddingHorizontal: 21,
    paddingVertical: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  appName: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '900',
  },

  heroSub: {
    color: '#dff5e7',
    marginTop: 4,
  },

  chicken: {
    fontSize: 66,
  },

  welcome: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
  },

  muted: {
    color: '#6d7871',
    marginTop: 4,
  },

  stats: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  statCard: {
    width: '48%',
    minHeight: 112,
    borderRadius: 17,
    padding: 14,
  },

  expenseCard: {
    width: '100%',
    minHeight: 100,
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  yellow: {
    backgroundColor: '#fff0b8',
  },

  red: {
    backgroundColor: '#ffd1d1',
  },

  green: {
    backgroundColor: '#c9f5d0',
  },

  statIcon: {
    fontSize: 30,
  },

  statTitle: {
    marginTop: 6,
    fontSize: 13,
  },

  statValue: {
    marginTop: 5,
    fontSize: 22,
    fontWeight: '900',
  },

  bigExpense: {
    fontSize: 25,
    fontWeight: '900',
    color: '#087c41',
    marginTop: 4,
  },

  infoCard: {
    margin: 12,
    padding: 16,
    backgroundColor: '#fff8d9',
    borderRadius: 16,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  finalSummary: {
    margin: 12,
    padding: 16,
    borderRadius: 17,
    backgroundColor: '#eaf7ee',
    borderWidth: 2,
    borderColor: '#087c41',
  },

  finalTitle: {
    color: '#087c41',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 10,
  },

  finalResultLabel: {
    fontSize: 18,
    fontWeight: '900',
  },

  finalResult: {
    color: '#087c41',
    fontSize: 21,
    fontWeight: '900',
  },

  historyBox: {
    margin: 12,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#fff',
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 13,
  },

  link: {
    color: '#1382df',
    fontWeight: '800',
  },

  empty: {
    color: '#758078',
    paddingVertical: 15,
  },

  pageTitle: {
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 14,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
  },

  label: {
    fontWeight: '700',
    marginBottom: 6,
  },

  subHeading: {
    color: '#087c41',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#d8e0da',
    borderRadius: 11,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 11,
  },

  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  moneyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d8e0da',
    borderRadius: 11,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  currency: {
    width: 38,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
  },

  subtotal: {
    backgroundColor: '#edf8f1',
    borderRadius: 11,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  bold: {
    fontWeight: '900',
  },

  line: {
    height: 1,
    backgroundColor: '#e2e7e3',
    marginVertical: 16,
  },

  livePreview: {
    backgroundColor: '#edf8f1',
    borderRadius: 11,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  liveText: {
    color: '#087c41',
    fontWeight: '900',
    fontSize: 18,
  },

  totalCard: {
    backgroundColor: '#eaf7ee',
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
  },

  totalTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  divider: {
    height: 1,
    backgroundColor: '#bfd6c5',
    marginVertical: 8,
  },

  totalStrong: {
    fontSize: 17,
    fontWeight: '900',
  },

  totalMoney: {
    color: '#087c41',
    fontSize: 20,
    fontWeight: '900',
  },

  loss: {
    color: '#d62929',
  },

  saveButton: {
    backgroundColor: '#087c41',
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
  },

  saveText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
  },

  bigLive: {
    color: '#087c41',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 5,
  },

  saleSummary: {
    backgroundColor: '#fff',
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
  },

  searchButton: {
    backgroundColor: '#087c41',
    borderRadius: 11,
    padding: 13,
    alignItems: 'center',
  },

  searchText: {
    color: '#fff',
    fontWeight: '900',
  },

  archiveTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 3,
  },

  historySingleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  historyEntry: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0ee',
  },

  historyTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  historyDate: {
    fontSize: 12,
    color: '#6b756e',
  },

  historyTime: {
    fontSize: 12,
    color: '#6b756e',
  },

  historyTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 7,
  },

  historyDetail: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 21,
  },

  notFound: {
    color: '#d62929',
    fontWeight: '700',
    textAlign: 'center',
    padding: 14,
  },

  nav: {
    height: 80,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e7e3',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    width: 70,
    alignItems: 'center',
  },

  navIcon: {
    fontSize: 22,
  },

  navText: {
    fontSize: 10,
    color: '#657068',
    marginTop: 3,
  },

  navActive: {
    color: '#087c41',
    fontWeight: '900',
  },

  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#079552',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },

  plus: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 40,
  },
});