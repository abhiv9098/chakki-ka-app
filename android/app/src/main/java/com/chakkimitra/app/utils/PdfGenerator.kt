package com.chakkimitra.app.utils

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import com.chakkimitra.app.data.local.entity.Order
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object PdfGenerator {

    fun generateInvoicePdf(context: Context, order: Order): File? {
        val pdfDocument = PdfDocument()
        // Page description: 300 width, 400 height, page index 1
        val pageInfo = PdfDocument.PageInfo.Builder(300, 400, 1).create()
        val page = pdfDocument.startPage(pageInfo)
        val canvas: Canvas = page.canvas

        val paint = Paint()
        val titlePaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 14f
            color = Color.rgb(0, 108, 71) // Theme primary green
        }
        val headerPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 10f
            color = Color.BLACK
        }
        val textPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textSize = 9f
            color = Color.DKGRAY
        }
        val totalPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 10f
            color = Color.rgb(0, 108, 71)
        }

        // Draw Header
        canvas.drawText("CHAKKI MITRA", 20f, 40f, titlePaint)
        canvas.drawText("TAX INVOICE / BILL", 20f, 55f, headerPaint)
        
        // Horizontal Line
        paint.color = Color.GRAY
        paint.strokeWidth = 1f
        canvas.drawLine(20f, 65f, 280f, 65f, paint)

        // Invoice Metadata
        val dateFormat = SimpleDateFormat("dd-MM-yyyy hh:mm a", Locale.getDefault())
        val dateString = dateFormat.format(Date(order.createdAt))
        
        canvas.drawText("Invoice No: CM-${order.id}", 20f, 85f, textPaint)
        canvas.drawText("Date: $dateString", 20f, 100f, textPaint)
        canvas.drawText("Payment: ${order.paymentType}", 20f, 115f, textPaint)
        
        canvas.drawLine(20f, 125f, 280f, 125f, paint)

        // Customer Info
        canvas.drawText("Bill To:", 20f, 140f, headerPaint)
        canvas.drawText(order.customerName, 20f, 155f, textPaint)
        
        canvas.drawLine(20f, 165f, 280f, 165f, paint)

        // Table Header
        canvas.drawText("Item / Grain", 20f, 185f, headerPaint)
        canvas.drawText("Qty (Kg)", 110f, 185f, headerPaint)
        canvas.drawText("Rate/Kg", 170f, 185f, headerPaint)
        canvas.drawText("Total", 230f, 185f, headerPaint)
        
        canvas.drawLine(20f, 195f, 280f, 195f, paint)

        // Table Row
        canvas.drawText(order.grainType, 20f, 215f, textPaint)
        canvas.drawText(String.format(Locale.US, "%.2f", order.weight), 110f, 215f, textPaint)
        canvas.drawText(String.format(Locale.US, "₹%.2f", order.rate), 170f, 215f, textPaint)
        canvas.drawText(String.format(Locale.US, "₹%.2f", order.totalAmount), 230f, 215f, textPaint)

        canvas.drawLine(20f, 235f, 280f, 235f, paint)

        // Total
        canvas.drawText("Grand Total:", 110f, 260f, totalPaint)
        canvas.drawText(String.format(Locale.US, "₹%.2f", order.totalAmount), 230f, 260f, totalPaint)

        // Thank you note
        paint.color = Color.rgb(0, 108, 71)
        paint.style = Paint.Style.STROKE
        canvas.drawRect(20f, 290f, 280f, 330f, paint)
        
        val notePaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
            textSize = 9f
            color = Color.rgb(0, 108, 71)
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("Thank you for your business!", 150f, 314f, notePaint)

        pdfDocument.finishPage(page)

        // Save PDF to Cache Dir
        val file = File(context.cacheDir, "ChakkiMitra_Bill_${order.id}.pdf")
        return try {
            val outputStream = FileOutputStream(file)
            pdfDocument.writeTo(outputStream)
            pdfDocument.close()
            outputStream.close()
            file
        } catch (e: Exception) {
            e.printStackTrace()
            pdfDocument.close()
            null
        }
    }
}
