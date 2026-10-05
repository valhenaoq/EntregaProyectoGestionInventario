package com.programaciondm.gestioninventario.ui.products

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.programaciondm.gestioninventario.R
import com.programaciondm.gestioninventario.data.models.Product

class ProductAdapter(
    private var productList: MutableList<Product> = mutableListOf()
) : RecyclerView.Adapter<ProductAdapter.ProductViewHolder>() {

    class ProductViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val textName: TextView = itemView.findViewById(R.id.textProductName)
        val textPrice: TextView = itemView.findViewById(R.id.textProductPrice)
        val textCode: TextView = itemView.findViewById(R.id.textProductCode)
        val textStock: TextView = itemView.findViewById(R.id.textProductStock)
        val textDescription: TextView = itemView.findViewById(R.id.textProductDescription)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProductViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_product, parent, false)
        return ProductViewHolder(view)
    }

    override fun onBindViewHolder(holder: ProductViewHolder, position: Int) {
        val product = productList[position]
        holder.textName.text = product.name
        holder.textPrice.text = "$${product.salePrice}"
        holder.textCode.text = if (!product.barcode.isNullOrEmpty()) "Código: ${product.barcode}" else ""
        holder.textStock.text = "Stock: ${product.stock}"
        if (!product.description.isNullOrEmpty()) {
            holder.textDescription.text = product.description
            holder.textDescription.visibility = View.VISIBLE
        } else {
            holder.textDescription.visibility = View.GONE
        }
    }

    override fun getItemCount(): Int = productList.size

    fun updateProducts(newProducts: List<Product>) {
        productList.clear()
        productList.addAll(newProducts)
        notifyDataSetChanged()
    }
}
